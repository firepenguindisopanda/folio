import { type ActionFunctionArgs, json } from "@remix-run/node";
import { createDataStreamResponse, generateText, streamText } from "ai";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { chatModel, thinkingOptions } from "~/lib/ai.server";
import { authenticator } from "~/lib/auth";
import { APP_NAME, EMPTY_ANSWER_TEXT } from "~/lib/constants";
import { db } from "~/lib/db";
import { chats, documents, messages } from "~/lib/db/schema";
import { generateId } from "~/lib/db/utils/generate-id";
import { consumeDailyMessage, minuteLimiter } from "~/lib/limits.server";
import type { ChatErrorCode } from "~/lib/chat-errors";
import { retrieveContext } from "~/lib/retrieval.server";

const bodySchema = z.object({
	chatId: z.string().regex(/^cht_[A-Za-z0-9]{14}$/),
	documentId: z.string().min(1),
	thinking: z.boolean().default(false),
	message: z.object({
		id: z.string().regex(/^msg_[A-Za-z0-9]{14}$/),
		content: z.string().trim().min(1).max(4000),
	}),
});

const errorResponse = (
	status: number,
	code: ChatErrorCode,
	error: string,
	extra: Record<string, unknown> = {},
) => json({ error, code, ...extra }, { status });

const systemPrompt = ({
	title,
	overview,
	outline,
	chapterTitles,
	excerpts,
}: {
	title: string;
	overview: string | null;
	outline: string[];
	chapterTitles: string[];
	excerpts: string[];
}) =>
	`You are ${APP_NAME}, an assistant that answers questions about the user's document "${title}".

## Document overview
${overview ?? "Not available for this document."}
${
	outline.length > 0
		? `
## Outline of the chapter or section asked about
${chapterTitles.length > 0 ? `Chapter: ${chapterTitles.join("; ")}\n` : ""}These passages come from the table of contents and the opening of the chapter or section the user means. They list its objectives and numbered sections.

${outline.map((passage, i) => `[O${i + 1}] ${passage}`).join("\n\n")}
`
		: ""
}
## Relevant excerpts
${excerpts.map((excerpt, i) => `[${i + 1}] ${excerpt}`).join("\n\n")}

## How to answer
- Base your answer on the overview and the excerpts above. For broad questions (what the document is about, its main idea, a summary), lead with the overview and add detail from the excerpts.
- If the material only partly covers the question, give the best answer you can from it and briefly mention what it doesn't cover. Only say you can't answer when nothing above is relevant.
- When the user asks about a specific chapter or section, use the outline to cover all of its numbered sections, then add detail from the excerpts.
- Never invent facts that the overview, outline or excerpts don't support, and don't guess what a chapter "likely" covers.
- Don't mention the passage labels (like [O1] or [3]); the user can't see them.
- Follow the user's requested style, such as plain English or a set number of bullet points.
- Write in Markdown: short paragraphs, bulleted or numbered lists for several items, and bold for key terms.`;

const generateTitle = async (question: string) => {
	try {
		const { text } = await generateText({
			model: chatModel,
			providerOptions: thinkingOptions(false),
			maxTokens: 30,
			temperature: 0.3,
			prompt: `Write a short title (at most 6 words) for a conversation that starts with this question. Reply with the title only, no quotes or punctuation at the end.\n\nQuestion: ${question}`,
		});
		const title = text
			.trim()
			.replace(/^["'*#\s]+|["'*.\s]+$/g, "")
			.slice(0, 80);
		if (title) return title;
	} catch (error) {
		console.error("Chat title generation failed:", error);
	}
	return question.slice(0, 60);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request);

	if (!user) {
		return errorResponse(
			401,
			"UNAUTHORIZED",
			"Your session has expired. Please sign in again.",
		);
	}

	const parsed = bodySchema.safeParse(await request.json().catch(() => null));

	if (!parsed.success) {
		return errorResponse(400, "BAD_REQUEST", "That message couldn't be sent.");
	}

	const { chatId, documentId, thinking, message } = parsed.data;

	const burst = await minuteLimiter.limit(`user:${user.id}`);

	if (!burst.success) {
		return errorResponse(
			429,
			"RATE_LIMIT",
			"You're sending messages too quickly. Please wait a moment.",
			{ reset: burst.reset },
		);
	}

	const [document] = await db
		.select({
			id: documents.id,
			title: documents.title,
			summary: documents.summary,
		})
		.from(documents)
		.where(
			and(eq(documents.documentId, documentId), eq(documents.userId, user.id)),
		);

	if (!document) {
		return errorResponse(404, "NOT_FOUND", "This document no longer exists.");
	}

	const { success: withinDailyLimit, ...usage } = await consumeDailyMessage(
		user.id,
	);

	if (!withinDailyLimit) {
		return errorResponse(
			429,
			"DAILY_LIMIT",
			`You've used all ${usage.limit} messages for today.`,
			usage,
		);
	}

	await db
		.insert(chats)
		.values({ chatId, userId: user.id, documentId: document.id })
		.onConflictDoNothing();

	const [chat] = await db.select().from(chats).where(eq(chats.chatId, chatId));

	if (!chat || chat.userId !== user.id || chat.documentId !== document.id) {
		return errorResponse(404, "NOT_FOUND", "This chat no longer exists.");
	}

	const history = await db
		.select()
		.from(messages)
		.where(eq(messages.chatId, chat.id))
		.orderBy(asc(messages.createdAt), asc(messages.id));

	const existingIndex = history.findIndex((m) => m.messageId === message.id);
	let conversation: typeof history;

	if (existingIndex >= 0) {
		const stale = history.slice(existingIndex + 1);
		if (stale.length > 0) {
			await db.delete(messages).where(
				inArray(
					messages.id,
					stale.map((m) => m.id),
				),
			);
		}
		conversation = history.slice(0, existingIndex + 1);
	} else {
		const [saved] = await db
			.insert(messages)
			.values({
				messageId: message.id,
				chatId: chat.id,
				role: "user",
				content: message.content,
			})
			.returning();
		conversation = [...history, saved];
	}

	return createDataStreamResponse({
		execute: async (dataStream) => {
			dataStream.writeData({ type: "usage", ...usage });
			dataStream.writeData({ type: "status", status: "searching" });

			const previousQuestion = conversation
				.filter((m) => m.role === "user" && m.messageId !== message.id)
				.at(-1)?.content;
			const { outline, chapterTitles, excerpts } = await retrieveContext({
				vectorDbId: user.vectorDbId,
				documentId,
				question: message.content,
				previousQuestion,
			});

			dataStream.writeData({
				type: "status",
				status: thinking ? "thinking" : "writing",
			});

			const result = streamText({
				model: chatModel,
				system: systemPrompt({
					title: document.title,
					overview: document.summary,
					outline,
					chapterTitles,
					excerpts,
				}),
				messages: conversation.map((m) => ({
					role: m.role,
					content: m.content,
				})),
				temperature: 0.2,
				maxTokens: 8192,
				providerOptions: thinkingOptions(thinking),
				experimental_generateMessageId: () => generateId({ object: "message" }),
				onFinish: async ({ text, reasoning, response }) => {
					const assistantMessageId =
						response.messages.find((m) => m.role === "assistant")?.id ??
						generateId({ object: "message" });

					await db.insert(messages).values({
						messageId: assistantMessageId,
						chatId: chat.id,
						role: "assistant",
						content: text.trim() ? text : EMPTY_ANSWER_TEXT,
						reasoning: reasoning || null,
					});

					await db
						.update(chats)
						.set({
							updatedAt: new Date(),
							...(chat.title
								? {}
								: { title: await generateTitle(conversation[0].content) }),
						})
						.where(eq(chats.id, chat.id));
				},
			});

			result.mergeIntoDataStream(dataStream, { sendReasoning: true });
		},
		onError: (error) => {
			console.error("Chat error:", error);
			return "The AI service didn't respond. Please try again.";
		},
	});
};
