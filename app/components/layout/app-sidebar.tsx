import {
	Link,
	NavLink,
	useLocation,
	useParams,
	useSubmit,
} from "@remix-run/react";
import {
	ChevronRight,
	FileText,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	MoreHorizontal,
	PanelLeftClose,
	PanelLeftOpen,
	Pencil,
	Plus,
	Settings,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import {
	Link as AriaLink,
	Button as ReactAriaButton,
	Tooltip,
	TooltipTrigger,
} from "react-aria-components";
import { useChatActions } from "~/components/chat/use-chat-actions";
import { Logo, LogoMark } from "~/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ConfirmDialog, RenameDialog } from "~/components/ui/dialog";
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuSeparator,
} from "~/components/ui/menu";
import { Meter } from "~/components/ui/meter";
import { useAppData } from "~/hooks/use-app-data";
import { cn } from "~/lib/utils/cn";
import { timeUntil } from "~/lib/utils/format";
import { ThemeSwitcher } from "./theme-switcher";

type SidebarDocument = ReturnType<typeof useAppData>["documents"][number];
type SidebarChat = SidebarDocument["chats"][number];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		"flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors",
		"focus-visible:ring-2 focus-visible:ring-primary-active",
		isActive
			? "bg-muted-element-active text-muted-high-contrast font-medium"
			: "text-muted-base hover:bg-muted-element-hover hover:text-muted-high-contrast",
	);

const ChatItem = ({
	chat,
	documentId,
}: { chat: SidebarChat; documentId: string }) => {
	const { renameChat, deleteChat } = useChatActions();
	const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
	const title = chat.title ?? "New chat";

	return (
		<li className="group/chat relative">
			<NavLink
				to={`/documents/${documentId}/chat/${chat.chatId}`}
				className={({ isActive }) =>
					cn(
						"block truncate rounded-md py-1.5 pl-3 pr-8 text-[13px] outline-none transition-colors",
						"focus-visible:ring-2 focus-visible:ring-primary-active",
						isActive
							? "bg-primary-element text-primary-high-contrast font-medium"
							: "text-muted-base hover:bg-muted-element-hover hover:text-muted-high-contrast",
					)
				}
			>
				{title}
			</NavLink>
			<Menu>
				<ReactAriaButton
					aria-label={`Options for ${title}`}
					className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-base opacity-0 outline-none transition-opacity hover:bg-muted-element-active hover:text-muted-high-contrast focus-visible:opacity-100 data-[pressed]:opacity-100 group-hover/chat:opacity-100 max-lg:opacity-100"
				>
					<MoreHorizontal className="size-4" />
				</ReactAriaButton>
				<MenuContent placement="bottom end">
					<MenuItem onAction={() => setDialog("rename")}>
						<Pencil className="size-4" /> Rename
					</MenuItem>
					<MenuItem
						onAction={() => setDialog("delete")}
						className="text-danger-base hover:text-danger-base focus:text-danger-base"
					>
						<Trash2 className="size-4" /> Delete
					</MenuItem>
				</MenuContent>
			</Menu>
			<RenameDialog
				key={title}
				isOpen={dialog === "rename"}
				onOpenChange={(open) => !open && setDialog(null)}
				title="Rename chat"
				initialValue={title}
				onSave={(value) => renameChat(chat.chatId, value)}
			/>
			<ConfirmDialog
				isOpen={dialog === "delete"}
				onOpenChange={(open) => !open && setDialog(null)}
				title="Delete this chat?"
				description={
					<>
						<span className="font-medium text-muted-high-contrast">
							{title}
						</span>{" "}
						and all of its messages will be permanently deleted.
					</>
				}
				confirmLabel="Delete chat"
				onConfirm={() => deleteChat(chat.chatId, documentId)}
			/>
		</li>
	);
};

const COLLAPSED_CHAT_COUNT = 5;

const DocumentGroup = ({ document }: { document: SidebarDocument }) => {
	const params = useParams();
	const isCurrent = params.id === document.documentId;
	const [expanded, setExpanded] = useState(true);
	const [showAll, setShowAll] = useState(false);
	const visibleChats = showAll
		? document.chats
		: document.chats.slice(0, COLLAPSED_CHAT_COUNT);

	return (
		<li>
			<div
				className={cn(
					"group/doc flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-muted-element-hover",
					isCurrent && "bg-muted-element",
				)}
			>
				<button
					type="button"
					aria-label={expanded ? "Collapse" : "Expand"}
					aria-expanded={expanded}
					onClick={() => setExpanded((v) => !v)}
					className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-base outline-none hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active"
				>
					<ChevronRight
						className={cn(
							"size-3.5 transition-transform",
							expanded && "rotate-90",
						)}
					/>
				</button>
				<Link
					to={`/documents/${document.documentId}/chat`}
					className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm text-muted-high-contrast outline-none focus-visible:ring-2 focus-visible:ring-primary-active rounded"
					title={document.title}
				>
					<FileText className="size-4 shrink-0 text-primary-base" />
					<span className="truncate">{document.title}</span>
				</Link>
				<Link
					to={`/documents/${document.documentId}/chat`}
					aria-label={`New chat about ${document.title}`}
					title="New chat"
					className="flex size-6 shrink-0 items-center justify-center rounded text-muted-base opacity-0 outline-none transition-opacity hover:bg-muted-element-active hover:text-muted-high-contrast focus-visible:opacity-100 group-hover/doc:opacity-100 max-lg:opacity-100"
				>
					<Plus className="size-4" />
				</Link>
			</div>
			{expanded && (
				<ul className="ml-[22px] mt-0.5 space-y-0.5 border-l border-muted pl-1.5">
					{document.chats.length === 0 ? (
						<li className="py-1.5 pl-3 text-[13px] text-muted-solid">
							No chats yet
						</li>
					) : (
						visibleChats.map((chat) => (
							<ChatItem
								key={chat.chatId}
								chat={chat}
								documentId={document.documentId}
							/>
						))
					)}
					{document.chats.length > COLLAPSED_CHAT_COUNT && (
						<li>
							<button
								type="button"
								onClick={() => setShowAll((v) => !v)}
								className="py-1 pl-3 text-xs text-muted-base outline-none hover:text-muted-high-contrast focus-visible:underline"
							>
								{showAll
									? "Show less"
									: `Show ${document.chats.length - COLLAPSED_CHAT_COUNT} more`}
							</button>
						</li>
					)}
				</ul>
			)}
		</li>
	);
};

const UsageCard = () => {
	const { usage } = useAppData();
	const { daily, documents } = usage;

	return (
		<div className="space-y-3 rounded-xl border border-muted bg-surface p-3 shadow-card">
			<div>
				<div className="mb-1.5 flex items-center justify-between text-xs">
					<span className="font-medium text-muted-high-contrast">
						Messages today
					</span>
					<span className="tabular-nums">
						{daily.used}/{daily.limit}
					</span>
				</div>
				<Meter value={daily.used} max={daily.limit} label="Messages today" />
				<p
					className="mt-1.5 text-[11px] text-muted-solid"
					suppressHydrationWarning
				>
					{daily.remaining === 0
						? `Limit reached | resets in ${timeUntil(daily.reset)}`
						: `Resets in ${timeUntil(daily.reset)}`}
				</p>
			</div>
			<div>
				<div className="mb-1.5 flex items-center justify-between text-xs">
					<span className="font-medium text-muted-high-contrast">
						Documents
					</span>
					<span className="tabular-nums">
						{documents.used}/{documents.limit}
					</span>
				</div>
				<Meter value={documents.used} max={documents.limit} label="Documents" />
			</div>
		</div>
	);
};

const AccountMenu = ({ compact = false }: { compact?: boolean }) => {
	const { user } = useAppData();
	const submit = useSubmit();

	return (
		<Menu>
			<ReactAriaButton
				aria-label="Account menu"
				className={cn(
					"flex items-center gap-2.5 rounded-lg text-left outline-none transition-colors hover:bg-muted-element-hover data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active",
					compact ? "p-1" : "w-full min-w-0 p-1.5",
				)}
			>
				<Avatar className="size-8">
					<AvatarImage src={user.avatarUrl ?? undefined} alt="" />
					<AvatarFallback className="bg-primary-element text-xs text-primary-high-contrast">
						{user.name?.charAt(0) ?? "?"}
					</AvatarFallback>
				</Avatar>
				{!compact && (
					<span className="min-w-0 flex-1">
						<span className="block truncate text-sm font-medium text-muted-high-contrast">
							{user.name}
						</span>
						<span className="block truncate text-xs">{user.email}</span>
					</span>
				)}
			</ReactAriaButton>
			<MenuContent
				placement={compact ? "right bottom" : "top start"}
				className="min-w-52"
			>
				{compact && (
					<MenuItem
						isDisabled
						className="flex-col items-start gap-0 disabled:cursor-default disabled:opacity-100"
					>
						<span className="text-sm font-medium text-muted-high-contrast">
							{user.name}
						</span>
						<span className="text-xs">{user.email}</span>
					</MenuItem>
				)}
				{compact && <MenuSeparator />}
				<MenuItem href="/settings">
					<Settings className="size-4" /> Settings
				</MenuItem>
				<MenuSeparator />
				<MenuItem
					onAction={() =>
						submit(null, { method: "POST", action: "/api/auth/logout" })
					}
				>
					<LogOut className="size-4" /> Sign out
				</MenuItem>
			</MenuContent>
		</Menu>
	);
};

const shortcutLabel = () =>
	typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
		? "⌘B"
		: "Ctrl+B";

const RailTooltip = ({
	label,
	children,
}: { label: string; children: React.ReactElement }) => (
	<TooltipTrigger delay={250} closeDelay={0}>
		{children}
		<Tooltip
			placement="right"
			offset={10}
			className="max-w-56 truncate rounded-md bg-muted-high-contrast px-2 py-1 text-xs font-medium text-muted-app shadow-lg entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out"
		>
			{label}
		</Tooltip>
	</TooltipTrigger>
);

const railItemClass = (active: boolean) =>
	cn(
		"flex size-10 items-center justify-center rounded-lg outline-none transition-colors",
		"data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active",
		active
			? "bg-muted-element-active text-muted-high-contrast"
			: "text-muted-base hover:bg-muted-element-hover hover:text-muted-high-contrast",
	);

const CollapsedRail = ({ onExpand }: { onExpand: () => void }) => {
	const { documents, usage } = useAppData();
	const { pathname } = useLocation();
	const params = useParams();
	const atDocumentLimit = usage.documents.used >= usage.documents.limit;
	const dailyRatio = Math.min(usage.daily.used / usage.daily.limit, 1);
	const usageLabel = `${usage.daily.used} of ${usage.daily.limit} messages used today`;

	return (
		<div className="flex h-full flex-col items-center gap-1 py-3">
			<Link
				to="/documents"
				aria-label="Dashboard"
				className="mb-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-active"
			>
				<LogoMark className="size-8" />
			</Link>
			<RailTooltip label={`Expand sidebar (${shortcutLabel()})`}>
				<ReactAriaButton
					aria-label="Expand sidebar"
					onPress={onExpand}
					className={railItemClass(false)}
				>
					<PanelLeftOpen className="size-[18px]" />
				</ReactAriaButton>
			</RailTooltip>

			<div className="my-1 h-px w-8 bg-muted" />

			<RailTooltip
				label={atDocumentLimit ? "Document limit reached" : "Upload document"}
			>
				{atDocumentLimit ? (
					<ReactAriaButton
						aria-label="Document limit reached"
						className={cn(railItemClass(false), "opacity-50")}
					>
						<Upload className="size-[18px]" />
					</ReactAriaButton>
				) : (
					<AriaLink
						href="/document/new"
						aria-label="Upload document"
						className="flex size-10 items-center justify-center rounded-lg bg-primary-solid text-white outline-none transition-colors hover:bg-primary-solid-hover data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-muted-app-subtle"
					>
						<Upload className="size-[18px]" />
					</AriaLink>
				)}
			</RailTooltip>
			<RailTooltip label="Dashboard">
				<AriaLink
					href="/documents"
					aria-label="Dashboard"
					className={railItemClass(pathname === "/documents")}
				>
					<LayoutDashboard className="size-[18px]" />
				</AriaLink>
			</RailTooltip>
			<RailTooltip label="Settings">
				<AriaLink
					href="/settings"
					aria-label="Settings"
					className={railItemClass(pathname === "/settings")}
				>
					<Settings className="size-[18px]" />
				</AriaLink>
			</RailTooltip>

			{documents.length > 0 && <div className="my-1 h-px w-8 bg-muted" />}

			<div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
				{documents.map((document) => (
					<RailTooltip key={document.documentId} label={document.title}>
						<AriaLink
							href={
								document.chats[0]
									? `/documents/${document.documentId}/chat/${document.chats[0].chatId}`
									: `/documents/${document.documentId}/chat`
							}
							aria-label={document.title}
							className={railItemClass(params.id === document.documentId)}
						>
							<FileText className="size-[18px]" />
						</AriaLink>
					</RailTooltip>
				))}
			</div>

			<RailTooltip label={usageLabel}>
				<ReactAriaButton
					aria-label={usageLabel}
					className="flex size-10 items-center justify-center rounded-lg outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active"
				>
					<svg
						viewBox="0 0 36 36"
						className="size-7 -rotate-90"
						aria-hidden="true"
					>
						<circle
							cx="18"
							cy="18"
							r="15"
							fill="none"
							strokeWidth="4"
							className="stroke-muted-element-active"
						/>
						<circle
							cx="18"
							cy="18"
							r="15"
							fill="none"
							strokeWidth="4"
							strokeLinecap="round"
							strokeDasharray={`${dailyRatio * 94.2} 94.2`}
							className={
								dailyRatio >= 1
									? "stroke-danger-solid"
									: dailyRatio >= 0.8
										? "stroke-warning-solid"
										: "stroke-primary-solid"
							}
						/>
					</svg>
				</ReactAriaButton>
			</RailTooltip>
			<AccountMenu compact />
		</div>
	);
};

export const AppSidebar = ({
	className,
	collapsed = false,
	onToggleCollapse,
}: {
	className?: string;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}) => {
	const { documents, usage } = useAppData();
	const atDocumentLimit = usage.documents.used >= usage.documents.limit;

	if (collapsed && onToggleCollapse) {
		return <CollapsedRail onExpand={onToggleCollapse} />;
	}

	return (
		<div className={cn("flex h-full w-72 flex-col", className)}>
			<div className="flex h-14 shrink-0 items-center justify-between gap-2 pl-4 pr-2">
				<Link
					to="/documents"
					aria-label="Dashboard"
					className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-active"
				>
					<Logo markClassName="size-7" />
				</Link>
				{onToggleCollapse && (
					<RailTooltip label={`Collapse sidebar (${shortcutLabel()})`}>
						<ReactAriaButton
							aria-label="Collapse sidebar"
							onPress={onToggleCollapse}
							className="flex size-8 items-center justify-center rounded-lg text-muted-base outline-none transition-colors hover:bg-muted-element-hover hover:text-muted-high-contrast data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active"
						>
							<PanelLeftClose className="size-[18px]" />
						</ReactAriaButton>
					</RailTooltip>
				)}
			</div>

			<div className="px-3 pb-2">
				{atDocumentLimit ? (
					<div
						className="flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-muted text-xs text-muted-base"
						title="Delete a document to upload another"
					>
						<Upload className="size-3.5" /> Document limit reached
					</div>
				) : (
					<Link
						to="/document/new"
						className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary-solid text-sm font-medium text-white shadow-sm outline-none transition-colors hover:bg-primary-solid-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-muted-app"
					>
						<Upload className="size-4" /> Upload document
					</Link>
				)}
			</div>

			<nav className="px-3 py-1" aria-label="Main">
				<NavLink to="/documents" end className={navLinkClass}>
					<LayoutDashboard className="size-4" /> Dashboard
				</NavLink>
				<NavLink to="/settings" className={navLinkClass}>
					<Settings className="size-4" /> Settings
				</NavLink>
			</nav>

			<div className="mt-3 flex min-h-0 flex-1 flex-col">
				<h2 className="flex items-center gap-2 px-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-solid">
					<MessageSquare className="size-3" /> Documents & chats
				</h2>
				<div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
					{documents.length === 0 ? (
						<p className="px-2 py-3 text-[13px] text-muted-solid">
							Upload a PDF to start chatting with it.
						</p>
					) : (
						<ul className="space-y-1">
							{documents.map((document) => (
								<DocumentGroup key={document.documentId} document={document} />
							))}
						</ul>
					)}
				</div>
			</div>

			<div className="space-y-3 border-t border-muted p-3">
				<UsageCard />
				<AccountMenu />
				<ThemeSwitcher className="w-full" />
			</div>
		</div>
	);
};
