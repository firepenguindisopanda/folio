import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "~/lib/db";
import { chats, documents, messages, users } from "~/lib/db/schema";

export const getUserSettings = async (userId: number) => {
	const [settings] = await db
		.select({ thinkingEnabled: users.thinkingEnabled })
		.from(users)
		.where(eq(users.id, userId));
	return settings ?? { thinkingEnabled: false };
};

export const getSidebarDocuments = async (userId: number) => {
	const [userDocuments, userChats] = await Promise.all([
		db
			.select({
				id: documents.id,
				documentId: documents.documentId,
				title: documents.title,
				createdAt: documents.createdAt,
			})
			.from(documents)
			.where(eq(documents.userId, userId))
			.orderBy(desc(documents.createdAt)),
		db
			.select({
				chatId: chats.chatId,
				title: chats.title,
				documentId: chats.documentId,
				updatedAt: chats.updatedAt,
			})
			.from(chats)
			.where(eq(chats.userId, userId))
			.orderBy(desc(chats.updatedAt)),
	]);

	return userDocuments.map(({ id, ...document }) => ({
		...document,
		chats: userChats
			.filter((chat) => chat.documentId === id)
			.map(({ documentId, ...chat }) => chat),
	}));
};

export const getRecentChats = async (userId: number, limit = 6) => {
	const recent = await db
		.select({
			id: chats.id,
			chatId: chats.chatId,
			title: chats.title,
			updatedAt: chats.updatedAt,
			documentId: documents.documentId,
			documentTitle: documents.title,
		})
		.from(chats)
		.innerJoin(documents, eq(chats.documentId, documents.id))
		.where(eq(chats.userId, userId))
		.orderBy(desc(chats.updatedAt))
		.limit(limit);

	if (recent.length === 0) return [];

	const lastMessages = await db
		.selectDistinctOn([messages.chatId], {
			chatId: messages.chatId,
			content: messages.content,
		})
		.from(messages)
		.where(
			inArray(
				messages.chatId,
				recent.map((chat) => chat.id),
			),
		)
		.orderBy(messages.chatId, desc(messages.createdAt));

	return recent.map(({ id, ...chat }) => ({
		...chat,
		preview:
			lastMessages.find((message) => message.chatId === id)?.content ?? "",
	}));
};

export const getFeedbackCounts = async (userId: number) => {
	const rows = await db
		.select({ feedback: messages.feedback, total: count() })
		.from(messages)
		.innerJoin(chats, eq(messages.chatId, chats.id))
		.where(
			and(eq(chats.userId, userId), inArray(messages.feedback, ["up", "down"])),
		)
		.groupBy(messages.feedback);

	return {
		up: rows.find((row) => row.feedback === "up")?.total ?? 0,
		down: rows.find((row) => row.feedback === "down")?.total ?? 0,
	};
};

export const getChatWithMessages = async ({
	chatId,
	userId,
}: { chatId: string; userId: number }) => {
	const [chat] = await db
		.select()
		.from(chats)
		.where(and(eq(chats.chatId, chatId), eq(chats.userId, userId)));

	if (!chat) return null;

	const chatMessages = await db
		.select()
		.from(messages)
		.where(eq(messages.chatId, chat.id))
		.orderBy(asc(messages.createdAt), asc(messages.id));

	return { chat, messages: chatMessages };
};
