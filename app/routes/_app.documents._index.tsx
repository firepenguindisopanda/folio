import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
	AlertTriangle,
	ArrowRight,
	FileText,
	MessageSquare,
	MessagesSquare,
	MoreHorizontal,
	SquarePen,
	ThumbsDown,
	ThumbsUp,
	Trash2,
	Upload as UploadIcon,
} from "lucide-react";
import { useState } from "react";
import { Button as ReactAriaButton } from "react-aria-components";
import { useChatActions } from "~/components/chat/use-chat-actions";
import { Upload } from "~/components/documents/upload";
import { MobileTopBar } from "~/components/layout/app-layout-context";
import { ConfirmDialog } from "~/components/ui/dialog";
import { Menu, MenuContent, MenuItem } from "~/components/ui/menu";
import { Meter } from "~/components/ui/meter";
import { useAppData } from "~/hooks/use-app-data";
import { authenticator } from "~/lib/auth";
import { getFeedbackCounts, getRecentChats } from "~/lib/chats.server";
import { APP_NAME } from "~/lib/constants";
import { cn } from "~/lib/utils/cn";
import { timeAgo, timeUntil } from "~/lib/utils/format";

export const meta: MetaFunction = () => [{ title: `Dashboard | ${APP_NAME}` }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	const [recentChats, feedback] = await Promise.all([
		getRecentChats(user.id),
		getFeedbackCounts(user.id),
	]);

	return json({ recentChats, feedback });
};

const stripMarkdown = (text: string) =>
	text
		.replace(/[*_#>`~[\]()-]+/g, "")
		.replace(/\s+/g, " ")
		.trim();

const StatCard = ({
	icon: Icon,
	label,
	value,
	children,
}: {
	icon: React.ElementType;
	label: string;
	value: React.ReactNode;
	children?: React.ReactNode;
}) => (
	<div className="rounded-2xl border border-muted bg-surface p-5 shadow-card">
		<div className="flex items-center gap-2 text-sm text-muted-base">
			<Icon className="size-4" />
			{label}
		</div>
		<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-muted-high-contrast">
			{value}
		</p>
		{children && <div className="mt-3 space-y-2">{children}</div>}
	</div>
);

const Banner = ({
	tone,
	children,
}: { tone: "warning" | "danger"; children: React.ReactNode }) => (
	<div
		role="status"
		className={cn(
			"flex items-start gap-3 rounded-xl border p-4 text-sm",
			tone === "warning" &&
				"border-warning bg-warning-app-subtle text-warning-high-contrast",
			tone === "danger" &&
				"border-danger bg-danger-app-subtle text-danger-high-contrast",
		)}
	>
		<AlertTriangle
			className={cn(
				"mt-0.5 size-4 shrink-0",
				tone === "warning" ? "text-warning-base" : "text-danger-base",
			)}
		/>
		<div>{children}</div>
	</div>
);

type DashboardDocument = ReturnType<typeof useAppData>["documents"][number];

const DocumentCard = ({ document }: { document: DashboardDocument }) => {
	const { deleteDocument } = useChatActions();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const latestChat = document.chats[0];

	return (
		<div className="group flex flex-col rounded-2xl border border-muted bg-surface p-5 shadow-card transition-colors hover:border-muted-hover">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-element text-primary-base">
					<FileText className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<h3
						className="truncate font-semibold text-muted-high-contrast"
						title={document.title}
					>
						{document.title}
					</h3>
					<p className="mt-0.5 text-xs text-muted-base">
						Uploaded {timeAgo(document.createdAt)} | {document.chats.length}{" "}
						{document.chats.length === 1 ? "chat" : "chats"}
					</p>
				</div>
				<Menu>
					<ReactAriaButton
						aria-label={`Options for ${document.title}`}
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-base outline-none hover:bg-muted-element-hover hover:text-muted-high-contrast data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active"
					>
						<MoreHorizontal className="size-4" />
					</ReactAriaButton>
					<MenuContent placement="bottom end">
						<MenuItem href={`/documents/${document.documentId}/chat`}>
							<SquarePen className="size-4" /> New chat
						</MenuItem>
						<MenuItem
							onAction={() => setConfirmOpen(true)}
							className="text-danger-base hover:text-danger-base focus:text-danger-base"
						>
							<Trash2 className="size-4" /> Delete document
						</MenuItem>
					</MenuContent>
				</Menu>
			</div>

			<div className="mt-4 flex-1 rounded-xl bg-muted-app-subtle px-3 py-2.5 text-xs">
				{latestChat ? (
					<>
						<span className="text-muted-solid">Last chat</span>
						<p className="mt-0.5 truncate font-medium text-muted-high-contrast">
							{latestChat.title ?? "New chat"}
						</p>
						<p className="text-muted-solid">{timeAgo(latestChat.updatedAt)}</p>
					</>
				) : (
					<p className="py-2 text-muted-base">
						No chats yet. Ask your first question.
					</p>
				)}
			</div>

			<div className="mt-4 flex gap-2">
				<Link
					to={
						latestChat
							? `/documents/${document.documentId}/chat/${latestChat.chatId}`
							: `/documents/${document.documentId}/chat`
					}
					className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-solid text-sm font-medium text-white outline-none transition-colors hover:bg-primary-solid-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
				>
					{latestChat ? "Continue chat" : "Start chatting"}
					<ArrowRight className="size-4" />
				</Link>
				{latestChat && (
					<Link
						to={`/documents/${document.documentId}/chat`}
						aria-label="New chat"
						title="New chat"
						className="inline-flex size-9 items-center justify-center rounded-lg border border-muted text-muted-base outline-none transition-colors hover:bg-muted-element-hover hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active"
					>
						<SquarePen className="size-4" />
					</Link>
				)}
			</div>

			<ConfirmDialog
				isOpen={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Delete this document?"
				description={
					<>
						<span className="font-medium text-muted-high-contrast">
							{document.title}
						</span>
						, its search index and all {document.chats.length}{" "}
						{document.chats.length === 1 ? "chat" : "chats"} will be permanently
						deleted. This frees up a document slot.
					</>
				}
				confirmLabel="Delete document"
				onConfirm={() => deleteDocument(document.documentId)}
			/>
		</div>
	);
};

export default function Dashboard() {
	const { recentChats, feedback } = useLoaderData<typeof loader>();
	const { user, documents, usage } = useAppData();
	const { daily } = usage;
	const atDocumentLimit = usage.documents.used >= usage.documents.limit;
	const totalChats = documents.reduce((sum, d) => sum + d.chats.length, 0);
	const firstName = user.name?.split(" ")[0];

	return (
		<>
			<MobileTopBar />
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight text-muted-high-contrast sm:text-3xl">
								Welcome back{firstName ? `, ${firstName}` : ""}
							</h1>
							<p className="mt-1 text-sm text-muted-base">
								Pick up a conversation or upload a new document.
							</p>
						</div>
						{documents.length > 0 &&
							(atDocumentLimit ? (
								<span className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-muted px-4 text-sm text-muted-base">
									<UploadIcon className="size-4" /> Document limit reached
								</span>
							) : (
								<Link
									to="/document/new"
									className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-solid px-4 text-sm font-medium text-white shadow-sm outline-none transition-colors hover:bg-primary-solid-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-muted-app"
								>
									<UploadIcon className="size-4" /> Upload document
								</Link>
							))}
					</div>

					{(daily.remaining === 0 ||
						(daily.remaining <= 10 && daily.remaining > 0) ||
						atDocumentLimit) && (
						<div className="space-y-3">
							{daily.remaining === 0 && (
								<Banner tone="danger">
									<p className="font-medium">
										You've reached today's limit of {daily.limit} messages
									</p>
									<p className="mt-0.5 opacity-90" suppressHydrationWarning>
										Chatting unlocks again in {timeUntil(daily.reset)} (midnight
										UTC). You can still browse your saved chats.
									</p>
								</Banner>
							)}
							{daily.remaining <= 10 && daily.remaining > 0 && (
								<Banner tone="warning">
									<p className="font-medium">
										Only {daily.remaining}{" "}
										{daily.remaining === 1 ? "message" : "messages"} left today
									</p>
									<p className="mt-0.5 opacity-90" suppressHydrationWarning>
										Your limit of {daily.limit} resets in{" "}
										{timeUntil(daily.reset)}.
									</p>
								</Banner>
							)}
							{atDocumentLimit && (
								<Banner tone="warning">
									<p className="font-medium">
										You've used all {usage.documents.limit} document slots
									</p>
									<p className="mt-0.5 opacity-90">
										Delete a document from its menu to upload a new one.
									</p>
								</Banner>
							)}
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-3">
						<StatCard
							icon={FileText}
							label="Documents"
							value={
								<>
									{usage.documents.used}
									<span className="text-base font-normal text-muted-solid">
										{" "}
										/ {usage.documents.limit}
									</span>
								</>
							}
						>
							<Meter
								value={usage.documents.used}
								max={usage.documents.limit}
								label="Documents used"
							/>
							<p className="text-xs text-muted-base">
								{atDocumentLimit
									? "All slots used"
									: `${usage.documents.limit - usage.documents.used} ${usage.documents.limit - usage.documents.used === 1 ? "slot" : "slots"} left`}
							</p>
						</StatCard>
						<StatCard
							icon={MessageSquare}
							label="Messages today"
							value={
								<>
									{daily.used}
									<span className="text-base font-normal text-muted-solid">
										{" "}
										/ {daily.limit}
									</span>
								</>
							}
						>
							<Meter
								value={daily.used}
								max={daily.limit}
								label="Messages used today"
							/>
							<p className="text-xs text-muted-base" suppressHydrationWarning>
								Resets in {timeUntil(daily.reset)}
							</p>
						</StatCard>
						<StatCard
							icon={MessagesSquare}
							label="Conversations"
							value={totalChats}
						>
							<p className="flex items-center gap-3 text-xs text-muted-base">
								<span className="inline-flex items-center gap-1">
									<ThumbsUp className="size-3.5 text-success-base" />{" "}
									{feedback.up} helpful
								</span>
								<span className="inline-flex items-center gap-1">
									<ThumbsDown className="size-3.5 text-danger-base" />{" "}
									{feedback.down} not helpful
								</span>
							</p>
						</StatCard>
					</div>

					{documents.length === 0 ? (
						<section>
							<h2 className="mb-1 text-lg font-semibold text-muted-high-contrast">
								Upload your first document
							</h2>
							<p className="mb-5 text-sm text-muted-base">
								We'll index it in your own private vector database, then you can
								ask it anything.
							</p>
							<Upload />
						</section>
					) : (
						<div className="grid gap-8 lg:grid-cols-3">
							<section className="lg:col-span-2">
								<h2 className="mb-4 text-lg font-semibold text-muted-high-contrast">
									Your documents
								</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									{documents.map((document) => (
										<DocumentCard
											key={document.documentId}
											document={document}
										/>
									))}
								</div>
							</section>
							<section>
								<h2 className="mb-4 text-lg font-semibold text-muted-high-contrast">
									Recent chats
								</h2>
								{recentChats.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-muted p-6 text-center text-sm text-muted-base">
										Your conversations will show up here.
									</div>
								) : (
									<ul className="divide-y divide-muted overflow-hidden rounded-2xl border border-muted bg-surface shadow-card">
										{recentChats.map((chat) => (
											<li key={chat.chatId}>
												<Link
													to={`/documents/${chat.documentId}/chat/${chat.chatId}`}
													className="block px-4 py-3 outline-none transition-colors hover:bg-muted-element-hover focus-visible:bg-muted-element-hover"
												>
													<div className="flex items-baseline justify-between gap-3">
														<p className="truncate text-sm font-medium text-muted-high-contrast">
															{chat.title ?? "New chat"}
														</p>
														<span className="shrink-0 text-[11px] text-muted-solid">
															{timeAgo(chat.updatedAt)}
														</span>
													</div>
													<p className="mt-0.5 truncate text-xs text-muted-base">
														{stripMarkdown(chat.preview)}
													</p>
													<p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-solid">
														<FileText className="size-3" /> {chat.documentTitle}
													</p>
												</Link>
											</li>
										))}
									</ul>
								)}
							</section>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
