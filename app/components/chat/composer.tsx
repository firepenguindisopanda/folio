import { ArrowUp, Brain, Clock, Square } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ToggleButton } from "react-aria-components";
import type { DailyUsage } from "~/lib/usage";
import { cn } from "~/lib/utils/cn";
import { timeUntil } from "~/lib/utils/format";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export const ThinkingToggle = ({
	isSelected,
	onChange,
}: { isSelected: boolean; onChange: (value: boolean) => void }) => (
	<ToggleButton
		isSelected={isSelected}
		onChange={onChange}
		aria-label="Thinking mode"
		className={cn(
			"inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium outline-none transition-colors",
			"data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active",
			"border-muted text-muted-base hover:border-muted-hover hover:text-muted-high-contrast",
			"data-[selected]:border-primary-hover data-[selected]:bg-primary-element data-[selected]:text-primary-high-contrast",
		)}
	>
		<Brain className="size-3.5" />
		Think
		<span className="sr-only">{isSelected ? "on" : "off"}</span>
	</ToggleButton>
);

export const DailyLimitNotice = ({ usage }: { usage: DailyUsage }) => (
	<div className="flex items-start gap-3 rounded-2xl border border-warning bg-warning-app-subtle p-4">
		<Clock className="mt-0.5 size-5 shrink-0 text-warning-base" />
		<div className="text-sm">
			<p className="font-medium text-warning-high-contrast">
				You've used all {usage.limit} messages for today
			</p>
			<p className="mt-0.5 text-warning-base" suppressHydrationWarning>
				Your limit resets in {timeUntil(usage.reset)} (midnight UTC). Your chats
				are saved, so you can pick up where you left off.
			</p>
		</div>
	</div>
);

export const Composer = ({
	value,
	onChange,
	onSubmit,
	onStop,
	isLoading,
	thinking,
	onThinkingChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onStop: () => void;
	isLoading: boolean;
	thinking: boolean;
	onThinkingChange: (value: boolean) => void;
	placeholder: string;
}) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: resize on value change
	useIsomorphicLayoutEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		if (value) el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
			className="rounded-2xl border border-muted bg-surface shadow-card transition focus-within:border-primary-hover focus-within:ring-4 focus-within:ring-primary-element"
		>
			<textarea
				ref={textareaRef}
				rows={1}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
						e.preventDefault();
						onSubmit();
					}
				}}
				placeholder={placeholder}
				aria-label="Message"
				maxLength={4000}
				className="block max-h-48 w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-relaxed text-muted-high-contrast outline-none placeholder:text-muted-solid"
			/>
			<div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
				<ThinkingToggle isSelected={thinking} onChange={onThinkingChange} />
				{isLoading ? (
					<button
						type="button"
						onClick={onStop}
						aria-label="Stop generating"
						title="Stop generating"
						className="flex size-9 items-center justify-center rounded-full bg-muted-high-contrast text-muted-app outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
					>
						<Square className="size-3.5" fill="currentColor" />
					</button>
				) : (
					<button
						type="submit"
						disabled={!value.trim()}
						aria-label="Send message"
						title="Send (Enter)"
						className="flex size-9 items-center justify-center rounded-full bg-primary-solid text-white outline-none transition-colors hover:bg-primary-solid-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:bg-muted-element-active disabled:text-muted-solid"
					>
						<ArrowUp className="size-4" />
					</button>
				)}
			</div>
		</form>
	);
};
