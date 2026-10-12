import { type ActionFunctionArgs, json } from "@remix-run/node";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authenticator } from "~/lib/auth";
import { db } from "~/lib/db";
import { chats } from "~/lib/db/schema";

const renameSchema = z.object({ title: z.string().trim().min(1).max(80) });

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) return json({ error: "Unauthorized" }, 401);

	const where = and(
		eq(chats.chatId, params.chatId ?? ""),
		eq(chats.userId, user.id),
	);

	if (request.method === "DELETE") {
		const deleted = await db
			.delete(chats)
			.where(where)
			.returning({ id: chats.id });
		if (deleted.length === 0) return json({ error: "Chat not found" }, 404);
		return json({ ok: true });
	}

	if (request.method === "PATCH") {
		const parsed = renameSchema.safeParse(
			await request.json().catch(() => null),
		);
		if (!parsed.success) return json({ error: "Invalid title" }, 400);

		const updated = await db
			.update(chats)
			.set({ title: parsed.data.title })
			.where(where)
			.returning({ id: chats.id });
		if (updated.length === 0) return json({ error: "Chat not found" }, 404);
		return json({ ok: true });
	}

	return json({ error: "Method not allowed" }, 405);
};
