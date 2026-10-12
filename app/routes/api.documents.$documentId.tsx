import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authenticator } from "~/lib/auth";
import { deleteDocument } from "~/lib/lifecycle.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	if (request.method !== "DELETE") {
		return json({ error: "Method not allowed" }, 405);
	}

	const user = await authenticator.isAuthenticated(request);
	if (!user) return json({ error: "Unauthorized" }, 401);

	try {
		const deleted = await deleteDocument({
			userId: user.id,
			vectorDbId: user.vectorDbId,
			documentId: params.documentId ?? "",
		});
		if (!deleted) return json({ error: "Document not found" }, 404);
		return json({ ok: true });
	} catch (error) {
		console.error("Document deletion failed:", error);
		return json(
			{ error: "The document couldn't be fully deleted. Please try again." },
			500,
		);
	}
};
