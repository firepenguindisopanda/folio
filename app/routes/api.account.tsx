import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticator } from "~/lib/auth";
import { destroySession, getSession } from "~/lib/auth/session.server";
import { deleteAccount } from "~/lib/lifecycle.server";

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== "DELETE") {
		return json({ error: "Method not allowed" }, 405);
	}

	const user = await authenticator.isAuthenticated(request);
	if (!user) return json({ error: "Unauthorized" }, 401);

	const body = await request.json().catch(() => null);

	if (body?.confirmEmail?.trim().toLowerCase() !== user.email.toLowerCase()) {
		return json({ error: "The email doesn't match your account." }, 400);
	}

	try {
		await deleteAccount(user.id);
	} catch (error) {
		console.error("Account deletion failed:", error);
		return json(
			{ error: "Your account couldn't be fully deleted. Please try again." },
			500,
		);
	}

	const session = await getSession(request.headers.get("Cookie"));
	return json(
		{ ok: true },
		{ headers: { "Set-Cookie": await destroySession(session) } },
	);
};
