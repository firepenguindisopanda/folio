import { Brain, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils/cn";

export const Reasoning = ({
	text,
	isStreaming,
}: { text: string; isStreaming: boolean }) => {
	const [open, setOpen] = useState(isStreaming);
	const [duration, setDuration] = useState<number | null>(null);
	const startedAt = useRef<number | null>(isStreaming ? Date.now() : null);
	const wasStreaming = useRef(isStreaming);
	const bodyRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isStreaming && !wasStreaming.current) {
			startedAt.current = Date.now();
			setOpen(true);
		}
		if (!isStreaming && wasStreaming.current) {
			if (startedAt.current) {
				setDuration(
					Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
				);
			}
			setOpen(false);
		}
		wasStreaming.current = isStreaming;
	}, [isStreaming]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new text
	useEffect(() => {
		if (isStreaming && bodyRef.current) {
			bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
		}
	}, [text, isStreaming]);

	const label = isStreaming
		? "Thinking..."
		: duration
			? `Thought for ${duration}s`
			: "Show thinking";

	return (
		<div className="overflow-hidden rounded-xl border border-muted bg-muted-app-subtle">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] outline-none transition-colors hover:bg-muted-element-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-active"
			>
				<Brain
					className={cn(
						"size-4 shrink-0",
						isStreaming ? "animate-pulse text-primary-base" : "text-muted-base",
					)}
				/>
				<span
					className={cn(
						"font-medium",
						isStreaming ? "text-shimmer" : "text-muted-base",
					)}
				>
					{label}
				</span>
				<ChevronDown
					className={cn(
						"ml-auto size-4 text-muted-base transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>
			{open && (
				<div
					ref={bodyRef}
					className="max-h-72 overflow-y-auto whitespace-pre-wrap border-t border-muted px-3.5 py-3 text-[13px] leading-relaxed text-muted-base"
				>
					{text}
				</div>
			)}
		</div>
	);
};
