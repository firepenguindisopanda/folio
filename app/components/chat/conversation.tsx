import { type Message, useChat } from "@ai-sdk/react";
import { useNavigate, useRevalidator } from "@remix-run/react";
import { AlertCircle, ArrowDown, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseChatError } from "~/lib/chat-errors";
import { generateId } from "~/lib/db/utils/generate-id";
import type { DailyUsage } from "~/lib/usage";
import { cn } from "~/lib/utils/cn";
import { timeUntil } from "~/lib/utils/format";
import { Composer, DailyLimitNotice } from "./composer";
import { EmptyState } from "./empty-state";
import {
	AssistantMessage,
	type Feedback,
	StatusIndicator,
	UserMessage,
} from "./message";

const STATUS_LABELS: Record<string, string> = {
	searching: "Searching your document...",
	thinking: "Thinking...",
	writing: "Writing an answer...",
};

type StreamData =
	| { type: "status"; status: string }
	| ({ type: "usage" } & DailyUsage);

const lastOfType = <T extends StreamData["type"]>(
	data: unknown[] | undefined,
	type: T,
) =>
	(data ?? [])
		.filter(
			(item): item is Extract<StreamData, { type: T }> =>
				typeof item === "object" &&
				item !== null &&
				(item as StreamData).type === type,
		)
		.at(-1);

export const Conversation = ({
	chatId: savedChatId,
	documentId,
	documentTitle,
	initialMessages,
	initialFeedback,
	thinkingDefault,
	initialUsage,
}: {
	chatId?: string;
	documentId: string;
	documentTitle: string;
	initialMessages: Message[];
	initialFeedback: Record<string, Feedback>;
	thinkingDefault: boolean;
	initialUsage: DailyUsage;
}) => {
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const [chatId] = useState(
		() => savedChatId ?? generateId({ object: "chat" }),
	);
	const [thinking, setThinking] = useState(thinkingDefault);
	const thinkingRef = useRef(thinking);
	thinkingRef.current = thinking;
	const [usage, setUsage] = useState(initialUsage);
	const [feedback, setFeedback] = useState(initialFeedback);

	const scrollRef = useRef<HTMLDivElement>(null);
	const [atBottom, setAtBottom] = useState(true);

	const {
		messages,
		setMessages,
		input,
		setInput,
		append,
		reload,
		stop,
		status,
		error,
		data,
		setData,
	} = useChat({
		id: chatId,
		api: "/api/document/chat",
		initialMessages,
		generateId: () => generateId({ object: "message" }),
		experimental_prepareRequestBody: ({ messages }) => {
			const last = messages[messages.length - 1];
			return {
				chatId,
				documentId,
				thinking: thinkingRef.current,
				message: { id: last.id, content: last.content },
			};
		},
		onFinish: () => {
			if (!savedChatId) {
				navigate(`/documents/${documentId}/chat/${chatId}`, {
					replace: true,
					preventScrollReset: true,
				});
			} else {
				revalidator.revalidate();
			}
		},
		onError: (err) => {
			const parsed = parseChatError(err);
			if (parsed?.code === "DAILY_LIMIT" || parsed?.code === "RATE_LIMIT") {
				setMessages((current) => {
					const last = current[current.length - 1];
					if (last?.role !== "user") return current;
					setInput(last.content);
					return current.slice(0, -1);
				});
			}
			if (parsed?.code === "DAILY_LIMIT") {
				setUsage((u) => ({
					...u,
					used: u.limit,
					remaining: 0,
					reset: parsed.reset ?? u.reset,
				}));
				toast.error(parsed.error, {
					description: `Your limit resets in ${timeUntil(parsed.reset ?? usage.reset)}.`,
				});
			} else if (parsed?.code === "RATE_LIMIT") {
				setUsage((u) => ({
					...u,
					used: Math.max(0, u.used - 1),
					remaining: u.remaining + 1,
				}));
				toast.warning(parsed.error);
			}
		},
	});

	const isLoading = status === "submitted" || status === "streaming";
	const latestUsage = lastOfType(data, "usage");
	const latestStatus = lastOfType(data, "status");
	const statusLabel =
		STATUS_LABELS[latestStatus?.status ?? "searching"] ??
		STATUS_LABELS.searching;
	const chatError = parseChatError(error);
	const showErrorCard =
		chatError &&
		chatError.code !== "DAILY_LIMIT" &&
		chatError.code !== "RATE_LIMIT";
	const limitReached = usage.remaining <= 0;

	useEffect(() => {
		if (latestUsage) {
			const { type, ...rest } = latestUsage;
			setUsage(rest);
		}
	}, [latestUsage]);

	const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
		const el = scrollRef.current;
		if (el) el.scrollTo({ top: el.scrollHeight, behavior });
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: follow new content
	useEffect(() => {
		if (atBottom) scrollToBottom("auto");
	}, [messages, status]);

	useEffect(() => scrollToBottom("auto"), [scrollToBottom]);

	const spendMessage = () =>
		setUsage((u) => ({
			...u,
			used: Math.min(u.limit, u.used + 1),
			remaining: Math.max(0, u.remaining - 1),
		}));

	const send = (text: string) => {
		const content = text.trim();
		if (!content || isLoading || limitReached) return;
		setData(undefined);
		spendMessage();
		setInput("");
		setAtBottom(true);
		append({ role: "user", content });
		requestAnimationFrame(() => scrollToBottom());
	};

	const regenerate = () => {
		if (isLoading || limitReached) return;
		setData(undefined);
		spendMessage();
		reload();
	};

	const changeThinking = (value: boolean) => {
		setThinking(value);
		fetch("/api/settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ thinkingEnabled: value }),
		}).catch(() => {});
		toast.success(value ? "Thinking on" : "Thinking off", {
			description: value
				? "The AI reasons step by step before answering. Slower, but better for complex questions."
				: "Faster, direct answers.",
			duration: 2500,
		});
	};

	const sendFeedback = async (messageId: string, value: Feedback) => {
		const previous = feedback[messageId];
		const next = previous === value ? null : value;
		setFeedback((f) => {
			const copy = { ...f };
			if (next) copy[messageId] = next;
			else delete copy[messageId];
			return copy;
		});
		const res = await fetch(`/api/messages/${messageId}/feedback`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ feedback: next }),
		}).catch(() => null);
		if (!res?.ok) {
			setFeedback((f) => {
				const copy = { ...f };
				if (previous) copy[messageId] = previous;
				else delete copy[messageId];
				return copy;
			});
			toast.error("Couldn't save your feedback. Please try again.");
			return;
		}
		if (next === "up") toast.success("Thanks for the feedback!");
		if (next === "down")
			toast.success("Thanks for letting us know", {
				description:
					"Try regenerating, or rephrase your question for a better answer.",
			});
	};

	const lastMessage = messages[messages.length - 1];

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				ref={scrollRef}
				onScroll={(e) => {
					const el = e.currentTarget;
					setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
				}}
				className="relative min-h-0 flex-1 overflow-y-auto"
			>
				<div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
					{messages.length === 0 ? (
						<EmptyState
							documentTitle={documentTitle}
							onPick={send}
							disabled={limitReached}
						/>
					) : (
						messages.map((message, index) =>
							message.role === "user" ? (
								<UserMessage key={message.id} content={message.content} />
							) : error &&
								index === messages.length - 1 &&
								!message.content ? null : (
								<AssistantMessage
									key={message.id}
									message={message}
									isLast={index === messages.length - 1}
									isStreaming={
										status === "streaming" && index === messages.length - 1
									}
									statusLabel={statusLabel}
									feedback={feedback[message.id]}
									onFeedback={(value) => sendFeedback(message.id, value)}
									onRegenerate={regenerate}
									canRegenerate={!isLoading && !limitReached}
								/>
							),
						)
					)}

					{status === "submitted" && lastMessage?.role === "user" && (
						<StatusIndicator label={statusLabel} />
					)}

					{showErrorCard && (
						<div
							role="alert"
							className="flex items-start gap-3 rounded-xl border border-danger bg-danger-app-subtle p-4 text-sm"
						>
							<AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-base" />
							<div className="flex-1">
								<p className="font-medium text-danger-high-contrast">
									The answer didn't come through
								</p>
								<p className="mt-0.5 text-danger-base">{chatError.error}</p>
							</div>
							<button
								type="button"
								onClick={regenerate}
								className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-danger px-2.5 py-1.5 text-xs font-medium text-danger-high-contrast outline-none hover:bg-danger-element focus-visible:ring-2 focus-visible:ring-danger-hover"
							>
								<RotateCcw className="size-3.5" /> Retry
							</button>
						</div>
					)}
				</div>
			</div>

			<div className="relative shrink-0 px-4 pb-4 pt-2 sm:px-6">
				{!atBottom && messages.length > 0 && (
					<button
						type="button"
						onClick={() => scrollToBottom()}
						aria-label="Scroll to latest message"
						className="absolute -top-11 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-muted bg-surface text-muted-base shadow-card outline-none hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active"
					>
						<ArrowDown className="size-4" />
					</button>
				)}
				<div className="mx-auto max-w-3xl">
					{limitReached && !isLoading ? (
						<DailyLimitNotice usage={usage} />
					) : (
						<Composer
							value={input}
							onChange={setInput}
							onSubmit={() => send(input)}
							onStop={stop}
							isLoading={isLoading}
							thinking={thinking}
							onThinkingChange={changeThinking}
							placeholder={`Ask about ${documentTitle}...`}
						/>
					)}
					<p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-center text-[11px] text-muted-solid">
						<span
							className={cn(
								"tabular-nums",
								usage.remaining <= 5 &&
									usage.remaining > 0 &&
									"font-medium text-warning-base",
								usage.remaining === 0 && "font-medium text-danger-base",
							)}
						>
							{usage.remaining} of {usage.limit} messages left today
						</span>
						<span aria-hidden="true">|</span>
						<span>
							Answers can be wrong. Check important details in the document.
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};
