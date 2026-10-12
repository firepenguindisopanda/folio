import { type ActionFunctionArgs, json } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authenticator } from "~/lib/auth";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { serializeTheme } from "~/lib/theme.server";

const bodySchema = z.object({
	theme: z.enum(["system", "light", "dark"]).optional(),
	thinkingEnabled: z.boolean().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	const parsed = bodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return json({ error: "Invalid settings" }, 400);

	const { theme, thinkingEnabled } = parsed.data;
	const headers = new Headers();

	if (theme) headers.append("Set-Cookie", await serializeTheme(theme));

	if (thinkingEnabled !== undefined) {
		const user = await authenticator.isAuthenticated(request);
		if (!user) return json({ error: "Unauthorized" }, 401);
		await db
			.update(users)
			.set({ thinkingEnabled })
			.where(eq(users.id, user.id));
	}

	return json({ ok: true }, { headers });
};
