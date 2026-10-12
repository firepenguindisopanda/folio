import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ArrowLeft, FileWarning, Lock, Sparkles, Zap } from "lucide-react";
import { Upload } from "~/components/documents/upload";
import { MobileTopBar } from "~/components/layout/app-layout-context";
import { useAppData } from "~/hooks/use-app-data";
import { APP_NAME } from "~/lib/constants";

export const meta: MetaFunction = () => [
	{ title: `Upload a document | ${APP_NAME}` },
];

const tips = [
	{
		Icon: Lock,
		title: "Private by design",
		text: "Your document is indexed into a vector database that only you can query.",
	},
	{
		Icon: Zap,
		title: "Ready in moments",
		text: "Most PDFs are ready to chat with in under a minute.",
	},
	{
		Icon: Sparkles,
		title: "Grounded answers",
		text: "Answers are written from passages of your document, not the open web.",
	},
];

export default function NewDocument() {
	const { usage } = useAppData();
	const atLimit = usage.documents.used >= usage.documents.limit;

	return (
		<>
			<MobileTopBar />
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
					<Link
						to="/documents"
						className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-base outline-none hover:text-muted-high-contrast focus-visible:underline"
					>
						<ArrowLeft className="size-4" /> Dashboard
					</Link>
					<h1 className="text-2xl font-semibold tracking-tight text-muted-high-contrast sm:text-3xl">
						Upload a document
					</h1>
					<p className="mb-8 mt-1 text-sm text-muted-base">
						{usage.documents.limit - usage.documents.used} of{" "}
						{usage.documents.limit} document slots available.
					</p>

					{atLimit ? (
						<div className="rounded-2xl border border-warning bg-warning-app-subtle p-6 text-center">
							<FileWarning className="mx-auto size-8 text-warning-base" />
							<p className="mt-3 font-semibold text-warning-high-contrast">
								You've reached the limit of {usage.documents.limit} documents
							</p>
							<p className="mt-1 text-sm text-warning-base">
								Delete a document from the dashboard to free up a slot.
							</p>
							<Link
								to="/documents"
								className="mt-5 inline-flex h-9 items-center rounded-lg bg-primary-solid px-4 text-sm font-medium text-white hover:bg-primary-solid-hover"
							>
								Manage documents
							</Link>
						</div>
					) : (
						<Upload />
					)}

					<ul className="mt-10 grid gap-4 sm:grid-cols-3">
						{tips.map(({ Icon, title, text }) => (
							<li key={title} className="text-sm">
								<Icon className="mb-2 size-5 text-primary-base" />
								<p className="font-medium text-muted-high-contrast">{title}</p>
								<p className="mt-0.5 text-muted-base">{text}</p>
							</li>
						))}
					</ul>
				</div>
			</div>
		</>
	);
}
