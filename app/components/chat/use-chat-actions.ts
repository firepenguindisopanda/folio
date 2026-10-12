import { useNavigate, useParams, useRevalidator } from "@remix-run/react";
import { toast } from "sonner";

const request = async (url: string, init: RequestInit) => {
	const res = await fetch(url, {
		...init,
		headers: { "Content-Type": "application/json" },
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error ?? "Request failed");
	}
};

export const useChatActions = () => {
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const params = useParams();

	const renameChat = async (chatId: string, title: string) => {
		try {
			await request(`/api/chats/${chatId}`, {
				method: "PATCH",
				body: JSON.stringify({ title }),
			});
			revalidator.revalidate();
		} catch {
			toast.error("Couldn't rename the chat. Please try again.");
		}
	};

	const deleteChat = async (chatId: string, documentId: string) => {
		try {
			await request(`/api/chats/${chatId}`, { method: "DELETE" });
			toast.success("Chat deleted");
			if (params.chatId === chatId) {
				navigate(`/documents/${documentId}/chat`);
			} else {
				revalidator.revalidate();
			}
		} catch {
			toast.error("Couldn't delete the chat. Please try again.");
		}
	};

	const deleteDocument = async (documentId: string) => {
		try {
			await request(`/api/documents/${documentId}`, { method: "DELETE" });
			toast.success("Document deleted");
			if (params.id === documentId) {
				navigate("/documents");
			} else {
				revalidator.revalidate();
			}
		} catch {
			toast.error("Couldn't delete the document. Please try again.");
		}
	};

	return { renameChat, deleteChat, deleteDocument };
};
