import { type ActionFunctionArgs, json } from "@remix-run/node";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authenticator } from "~/lib/auth";
import { db } from "~/lib/db";
import { chats, messages } from "~/lib/db/schema";

const bodySchema = z.object({ feedback: z.enum(["up", "down"]).nullable() });

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) return json({ error: "Unauthorized" }, 401);

	const parsed = bodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return json({ error: "Invalid feedback" }, 400);

	const [message] = await db
		.select({ id: messages.id })
		.from(messages)
		.innerJoin(chats, eq(messages.chatId, chats.id))
		.where(
			and(
				eq(messages.messageId, params.messageId ?? ""),
				eq(messages.role, "assistant"),
				eq(chats.userId, user.id),
			),
		);

	if (!message) return json({ error: "Message not found" }, 404);

	await db
		.update(messages)
		.set({ feedback: parsed.data.feedback })
		.where(eq(messages.id, message.id));

	return json({ ok: true });
};
