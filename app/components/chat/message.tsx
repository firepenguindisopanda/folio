import type { Message } from "@ai-sdk/react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { LogoMark } from "~/components/brand/logo";
import { Markdown } from "~/components/ui/markdown";
import { EMPTY_ANSWER_TEXT } from "~/lib/constants";
import { cn } from "~/lib/utils/cn";
import { Reasoning } from "./reasoning";

export type Feedback = "up" | "down";

export const UserMessage = ({ content }: { content: string }) => (
	<div className="flex justify-end">
		<div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary-solid px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
			{content}
		</div>
	</div>
);

const AssistantShell = ({
	children,
	className,
}: { children: React.ReactNode; className?: string }) => (
	<div className={cn("group/message flex gap-3", className)}>
		<LogoMark className="mt-0.5 size-7" />
		<div className="min-w-0 flex-1 space-y-3">{children}</div>
	</div>
);

export const StatusIndicator = ({ label }: { label: string }) => (
	<AssistantShell>
		<div className="flex h-7 items-center gap-2.5" role="status">
			<span className="flex gap-1" aria-hidden="true">
				{[0, 150, 300].map((delay) => (
					<span
						key={delay}
						className="size-1.5 animate-bounce rounded-full bg-primary-solid"
						style={{ animationDelay: `${delay}ms` }}
					/>
				))}
			</span>
			<span className="text-shimmer text-sm font-medium">{label}</span>
		</div>
	</AssistantShell>
);

const ActionButton = ({
	label,
	onClick,
	active,
	children,
	disabled,
}: {
	label: string;
	onClick: () => void;
	active?: boolean;
	children: React.ReactNode;
	disabled?: boolean;
}) => (
	<button
		type="button"
		aria-label={label}
		title={label}
		aria-pressed={active}
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"flex size-8 items-center justify-center rounded-lg outline-none transition-colors",
			"focus-visible:ring-2 focus-visible:ring-primary-active disabled:opacity-40",
			active
				? "bg-primary-element text-primary-base"
				: "text-muted-solid hover:bg-muted-element-hover hover:text-muted-high-contrast",
		)}
	>
		{children}
	</button>
);

export const AssistantMessage = ({
	message,
	isStreaming,
	isLast,
	statusLabel,
	feedback,
	onFeedback,
	onRegenerate,
	canRegenerate,
}: {
	message: Message;
	isStreaming: boolean;
	isLast: boolean;
	statusLabel: string;
	feedback?: Feedback;
	onFeedback: (value: Feedback) => void;
	onRegenerate: () => void;
	canRegenerate: boolean;
}) => {
	const [copied, setCopied] = useState(false);
	const reasoningPart = message.parts?.find(
		(part) => part.type === "reasoning",
	);
	const reasoning =
		reasoningPart?.type === "reasoning" ? reasoningPart.reasoning : "";
	const content = message.content;

	if (isStreaming && !content && !reasoning) {
		return <StatusIndicator label={statusLabel} />;
	}

	const copy = async () => {
		await navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<AssistantShell>
			{reasoning && (
				<Reasoning text={reasoning} isStreaming={isStreaming && !content} />
			)}
			{content ? (
				<Markdown className="text-[15px] text-muted-high-contrast">
					{content}
				</Markdown>
			) : (
				!isStreaming && (
					<p className="rounded-lg border border-warning bg-warning-app-subtle px-3 py-2 text-sm text-warning-base">
						{EMPTY_ANSWER_TEXT}
					</p>
				)
			)}
			{!isStreaming && (
				<div
					className={cn(
						"-ml-1.5 flex items-center gap-0.5 transition-opacity",
						isLast
							? "opacity-100"
							: "opacity-0 focus-within:opacity-100 group-hover/message:opacity-100 max-lg:opacity-100",
					)}
				>
					{content && (
						<ActionButton label={copied ? "Copied" : "Copy"} onClick={copy}>
							{copied ? (
								<Check className="size-4 text-success-base" />
							) : (
								<Copy className="size-4" />
							)}
						</ActionButton>
					)}
					<ActionButton
						label="Good answer"
						active={feedback === "up"}
						onClick={() => onFeedback("up")}
					>
						<ThumbsUp className="size-4" />
					</ActionButton>
					<ActionButton
						label="Bad answer"
						active={feedback === "down"}
						onClick={() => onFeedback("down")}
					>
						<ThumbsDown className="size-4" />
					</ActionButton>
					{isLast && (
						<ActionButton
							label="Regenerate answer"
							onClick={onRegenerate}
							disabled={!canRegenerate}
						>
							<RefreshCw className="size-4" />
						</ActionButton>
					)}
				</div>
			)}
		</AssistantShell>
	);
};
