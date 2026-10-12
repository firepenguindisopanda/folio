import { BookOpen, CalendarDays, Lightbulb, ListChecks } from "lucide-react";
import { LogoMark } from "~/components/brand/logo";

const suggestions = [
	{
		title: "Summarize it",
		description: "The key points in 5 bullets",
		prompt: "Summarize this document in 5 bullet points.",
		Icon: ListChecks,
	},
	{
		title: "Main topics",
		description: "What the document covers",
		prompt: "What are the main topics covered in this document?",
		Icon: BookOpen,
	},
	{
		title: "Dates & deadlines",
		description: "Anything time-sensitive",
		prompt: "List any important dates, deadlines or time periods mentioned.",
		Icon: CalendarDays,
	},
	{
		title: "Explain simply",
		description: "Plain-language requirements",
		prompt:
			"Explain the most important requirements in this document in simple terms.",
		Icon: Lightbulb,
	},
];

export const EmptyState = ({
	documentTitle,
	onPick,
	disabled,
}: {
	documentTitle: string;
	onPick: (prompt: string) => void;
	disabled?: boolean;
}) => (
	<div className="flex min-h-full flex-col items-center justify-center px-2 py-10 text-center">
		<div className="relative mb-5">
			<div className="absolute inset-0 rounded-full bg-primary-solid opacity-30 blur-2xl" />
			<LogoMark className="relative size-14" />
		</div>
		<h2 className="text-xl font-semibold tracking-tight text-muted-high-contrast sm:text-2xl">
			What would you like to know?
		</h2>
		<p className="mt-2 max-w-md text-sm text-muted-base">
			Ask anything about{" "}
			<span className="font-medium text-muted-high-contrast">
				{documentTitle}
			</span>
			. Answers come straight from the document.
		</p>
		<div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
			{suggestions.map(({ title, description, prompt, Icon }) => (
				<button
					key={title}
					type="button"
					disabled={disabled}
					onClick={() => onPick(prompt)}
					className="group flex items-start gap-3 rounded-xl border border-muted bg-surface p-3.5 text-left shadow-card outline-none transition-colors hover:border-primary-hover hover:bg-primary-app-subtle focus-visible:ring-2 focus-visible:ring-primary-active disabled:pointer-events-none disabled:opacity-50"
				>
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-element text-primary-base">
						<Icon className="size-4" />
					</span>
					<span>
						<span className="block text-sm font-medium text-muted-high-contrast">
							{title}
						</span>
						<span className="block text-xs text-muted-base">{description}</span>
					</span>
				</button>
			))}
		</div>
	</div>
);
