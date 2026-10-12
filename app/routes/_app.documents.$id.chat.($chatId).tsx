import type { Message } from "@ai-sdk/react";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
	redirect,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { and, eq } from "drizzle-orm";
import {
	FileText,
	PanelRightClose,
	PanelRightOpen,
	SquarePen,
	X,
} from "lucide-react";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Conversation } from "~/components/chat/conversation";
import type { Feedback } from "~/components/chat/message";
import { OpenSidebarButton } from "~/components/layout/app-layout-context";
import { useAppData } from "~/hooks/use-app-data";
import { useMediaQuery } from "~/hooks/use-media-query";
import { authenticator } from "~/lib/auth";
import { getChatWithMessages } from "~/lib/chats.server";
import { APP_NAME } from "~/lib/constants";
import { db } from "~/lib/db";
import { documents } from "~/lib/db/schema";
import { getFileUrl } from "~/lib/files.server";
import { cn } from "~/lib/utils/cn";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
	{
		title: data
			? `${data.chat?.title ?? data.document.title} | ${APP_NAME}`
			: APP_NAME,
	},
];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	const [document] = await db
		.select()
		.from(documents)
		.where(
			and(
				eq(documents.documentId, params.id ?? ""),
				eq(documents.userId, user.id),
			),
		);

	if (!document) throw redirect("/documents");

	let chat: { chatId: string; title: string | null } | null = null;
	let initialMessages: Message[] = [];
	let initialFeedback: Record<string, Feedback> = {};

	if (params.chatId) {
		const result = await getChatWithMessages({
			chatId: params.chatId,
			userId: user.id,
		});

		if (!result || result.chat.documentId !== document.id) {
			throw redirect(`/documents/${document.documentId}/chat`);
		}

		chat = { chatId: result.chat.chatId, title: result.chat.title };
		initialMessages = result.messages.map((m) => ({
			id: m.messageId,
			role: m.role,
			content: m.content,
			parts: [
				...(m.reasoning
					? [
							{
								type: "reasoning" as const,
								reasoning: m.reasoning,
								details: [{ type: "text" as const, text: m.reasoning }],
							},
						]
					: []),
				{ type: "text" as const, text: m.content },
			],
		}));
		initialFeedback = Object.fromEntries(
			result.messages.flatMap((m) =>
				m.feedback ? [[m.messageId, m.feedback]] : [],
			),
		);
	}

	return json({
		document: { documentId: document.documentId, title: document.title },
		chat,
		initialMessages,
		initialFeedback,
		fileUrl: await getFileUrl(document.fileName),
	});
};

const PdfViewer = ({ url, title }: { url: string; title: string }) => (
	<iframe src={url} title={title} className="h-full w-full border-0 bg-white" />
);

export default function ChatPage() {
	const { document, chat, initialMessages, initialFeedback, fileUrl } =
		useLoaderData<typeof loader>();
	const { settings, usage } = useAppData();
	const isDesktop = useMediaQuery("(min-width: 1024px)");
	const [pdfOpen, setPdfOpen] = useState(true);
	const [mobilePdfOpen, setMobilePdfOpen] = useState(false);
	const showDesktopPdf = isDesktop && pdfOpen;

	const conversation = (
		<Conversation
			key={chat?.chatId ?? "new"}
			chatId={chat?.chatId}
			documentId={document.documentId}
			documentTitle={document.title}
			initialMessages={initialMessages as Message[]}
			initialFeedback={initialFeedback as Record<string, Feedback>}
			thinkingDefault={settings.thinkingEnabled}
			initialUsage={usage.daily}
		/>
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex h-14 shrink-0 items-center gap-2 border-b border-muted px-3 sm:px-4">
				<OpenSidebarButton />
				<div className="flex min-w-0 flex-1 items-center gap-2.5">
					<span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-primary-element text-primary-base sm:flex">
						<FileText className="size-4" />
					</span>
					<div className="min-w-0">
						<h1 className="truncate text-sm font-semibold text-muted-high-contrast">
							{chat?.title ?? "New chat"}
						</h1>
						<p className="truncate text-xs text-muted-base">{document.title}</p>
					</div>
				</div>
				<Link
					to={`/documents/${document.documentId}/chat`}
					className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-base outline-none transition-colors hover:bg-muted-element-hover hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active"
				>
					<SquarePen className="size-4" />
					<span className="hidden sm:inline">New chat</span>
				</Link>
				<button
					type="button"
					onClick={() =>
						isDesktop ? setPdfOpen((v) => !v) : setMobilePdfOpen(true)
					}
					aria-pressed={isDesktop ? pdfOpen : undefined}
					className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-base outline-none transition-colors hover:bg-muted-element-hover hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active"
				>
					{showDesktopPdf ? (
						<PanelRightClose className="size-4" />
					) : (
						<PanelRightOpen className="size-4" />
					)}
					<span className="hidden sm:inline">
						{showDesktopPdf ? "Hide PDF" : "View PDF"}
					</span>
				</button>
			</header>

			<PanelGroup
				direction="horizontal"
				autoSaveId="chat-pdf-layout"
				className="min-h-0 flex-1"
			>
				<Panel id="chat" order={1} minSize={35} defaultSize={55}>
					{conversation}
				</Panel>
				{showDesktopPdf && (
					<>
						<PanelResizeHandle className="group relative w-px bg-muted outline-none data-[resize-handle-state=drag]:bg-primary-solid data-[resize-handle-state=hover]:bg-primary-hover">
							<span className="absolute inset-y-0 -left-1.5 -right-1.5" />
						</PanelResizeHandle>
						<Panel id="pdf" order={2} minSize={25} defaultSize={45}>
							<PdfViewer url={fileUrl} title={document.title} />
						</Panel>
					</>
				)}
			</PanelGroup>

			{mobilePdfOpen && !isDesktop && (
				<div
					className={cn(
						"fixed inset-0 z-40 flex flex-col bg-muted-app animate-in slide-in-from-bottom-4 fade-in",
					)}
					role="dialog"
					aria-label={document.title}
				>
					<div className="flex h-14 shrink-0 items-center gap-2 border-b border-muted px-3">
						<FileText className="size-4 text-primary-base" />
						<p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-high-contrast">
							{document.title}
						</p>
						<button
							type="button"
							onClick={() => setMobilePdfOpen(false)}
							aria-label="Close PDF"
							className="flex size-9 items-center justify-center rounded-lg text-muted-base hover:bg-muted-element-hover hover:text-muted-high-contrast"
						>
							<X className="size-5" />
						</button>
					</div>
					<div className="min-h-0 flex-1">
						<PdfViewer url={fileUrl} title={document.title} />
					</div>
				</div>
			)}
		</div>
	);
}
