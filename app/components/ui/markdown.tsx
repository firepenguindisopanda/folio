import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils/cn";

const Markdown = ({
	children,
	className,
}: { children: string; className?: string }) => (
	<div
		className={cn(
			"min-w-0 space-y-3 leading-relaxed break-words",
			"[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1",
			"[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold",
			"[&_strong]:font-semibold [&_strong]:text-muted-high-contrast",
			"[&_a]:underline [&_a]:underline-offset-4",
			"[&_code]:rounded [&_code]:bg-muted-element [&_code]:px-1 [&_code]:text-xs",
			"[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted-element [&_pre]:p-3",
			"[&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:border-muted [&_th]:p-2 [&_td]:border-b [&_td]:border-muted [&_td]:p-2",
			className,
		)}
	>
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
			}}
		>
			{children}
		</ReactMarkdown>
	</div>
);

export { Markdown };
