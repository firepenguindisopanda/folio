import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input, TextField } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";

export const DeleteAccount = ({
	email,
	documentCount,
	chatCount,
}: { email: string; documentCount: number; chatCount: number }) => {
	const [open, setOpen] = useState(false);
	const [confirmEmail, setConfirmEmail] = useState("");
	const [pending, setPending] = useState(false);
	const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

	const deleteAccount = async () => {
		setPending(true);
		const res = await fetch("/api/account", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ confirmEmail }),
		}).catch(() => null);

		if (res?.ok) {
			window.location.assign("/?account=deleted");
			return;
		}

		const body = await res?.json().catch(() => ({}));
		toast.error(
			body?.error ?? "Your account couldn't be deleted. Please try again.",
		);
		setPending(false);
	};

	return (
		<section className="rounded-2xl border border-danger bg-surface p-5 shadow-card sm:p-6">
			<h2 className="font-semibold text-danger-high-contrast">
				Delete account
			</h2>
			<p className="mt-1 text-sm text-muted-base">
				Permanently delete your account and everything in it. This can't be
				undone.
			</p>
			<Button
				variant="danger"
				className="mt-5 gap-2 font-medium"
				onPress={() => setOpen(true)}
			>
				<Trash2 className="size-4" /> Delete my account
			</Button>

			<Dialog
				isOpen={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) setConfirmEmail("");
				}}
				title="Delete your account?"
				description={
					<div className="space-y-3">
						<div className="flex gap-2.5 rounded-lg border border-danger bg-danger-app-subtle p-3 text-danger-high-contrast">
							<AlertTriangle className="mt-0.5 size-4 shrink-0" />
							<p>This permanently deletes:</p>
						</div>
						<ul className="list-disc space-y-1 pl-5">
							<li>
								{documentCount} {documentCount === 1 ? "document" : "documents"}{" "}
								and the uploaded PDF files
							</li>
							<li>
								{chatCount} {chatCount === 1 ? "chat" : "chats"}, their messages
								and your feedback
							</li>
							<li>Your private vector database</li>
							<li>Your profile and settings</li>
						</ul>
						<p>
							Type{" "}
							<span className="font-medium text-muted-high-contrast">
								{email}
							</span>{" "}
							to confirm.
						</p>
					</div>
				}
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (matches && !pending) deleteAccount();
					}}
				>
					<TextField
						aria-label="Your email"
						value={confirmEmail}
						onChange={setConfirmEmail}
						autoFocus
						className="mt-4"
					>
						<Input
							autoComplete="off"
							className="w-full rounded-lg border border-muted bg-muted-app px-3 py-2 text-sm text-muted-high-contrast outline-none focus:border-danger-solid focus:ring-2 focus:ring-danger-element"
						/>
					</TextField>
					<div className="mt-6 flex justify-end gap-2">
						<Button variant="ghost" onPress={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="danger"
							isDisabled={!matches || pending}
						>
							{pending ? "Deleting everything..." : "Delete account"}
						</Button>
					</div>
				</form>
			</Dialog>
		</section>
	);
};
