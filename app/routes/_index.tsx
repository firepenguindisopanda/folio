import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
	redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
	Brain,
	Database,
	FileSearch,
	FileText,
	MessagesSquare,
	ThumbsUp,
	Upload,
} from "lucide-react";
import { LogoMark } from "~/components/brand/logo";
import { GoogleSignIn } from "~/components/auth/google-sign-in";
import { SiteHeader } from "~/components/layout/site-header";
import { authenticator } from "~/lib/auth";
import { APP_NAME } from "~/lib/constants";

export const meta: MetaFunction = () => [
	{ title: `${APP_NAME} | Chat with your documents` },
	{
		name: "description",
		content:
			"Upload a PDF and get instant answers grounded in your document, with a private vector database for every user.",
	},
];

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await authenticator.isAuthenticated(request);
	if (user) return redirect("/documents");
	const accountDeleted =
		new URL(request.url).searchParams.get("account") === "deleted";
	return json({ accountDeleted });
}

const features = [
	{
		Icon: Database,
		title: "Your own vector database",
		text: "Every account gets a dedicated, isolated database for its documents. Nothing is shared between users.",
	},
	{
		Icon: FileSearch,
		title: "Answers from your PDF",
		text: "Relevant passages are retrieved from your document before each answer, so replies stay grounded.",
	},
	{
		Icon: Brain,
		title: "See how it thinks",
		text: "Turn on thinking mode for tough questions and read the model's reasoning as it works.",
	},
	{
		Icon: MessagesSquare,
		title: "Saved conversations",
		text: "Keep several chats per document, rename them, and pick up right where you left off.",
	},
];

const steps = [
	{
		Icon: Upload,
		title: "Upload a PDF",
		text: "Handbooks, contracts, papers, manuals.",
	},
	{
		Icon: FileSearch,
		title: "We index it",
		text: "Privately, in about a minute.",
	},
	{
		Icon: MessagesSquare,
		title: "Ask anything",
		text: "Get clear answers in seconds.",
	},
];

const HeroPreview = () => (
	<div className="relative mx-auto w-full max-w-xl">
		<div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#4F6BFF] to-[#9B5CFF] opacity-20 blur-3xl" />
		<div className="relative overflow-hidden rounded-2xl border border-muted bg-surface shadow-2xl">
			<div className="flex items-center gap-2 border-b border-muted px-4 py-3">
				<span className="flex size-7 items-center justify-center rounded-lg bg-primary-element text-primary-base">
					<FileText className="size-3.5" />
				</span>
				<div className="min-w-0">
					<p className="text-xs font-semibold text-muted-high-contrast">
						Programme requirements
					</p>
					<p className="text-[11px] text-muted-base">
						Student Handbook 2026.pdf
					</p>
				</div>
			</div>
			<div className="space-y-4 p-4 text-[13px]">
				<div className="flex justify-end">
					<p className="max-w-[80%] rounded-2xl rounded-br-md bg-primary-solid px-3.5 py-2 text-white">
						Which majors does the computing department offer?
					</p>
				</div>
				<div className="flex gap-2.5">
					<LogoMark className="size-6" />
					<div className="flex-1 space-y-2.5">
						<div className="flex items-center gap-2 rounded-lg border border-muted bg-muted-app-subtle px-2.5 py-1.5 text-[11px] text-muted-base">
							<Brain className="size-3.5" /> Thought for 3s
						</div>
						<p className="text-muted-high-contrast">
							The department offers two majors:
						</p>
						<ol className="list-decimal space-y-1 pl-4 text-muted-high-contrast">
							<li>
								<strong>Computer Science</strong>, including a Special option
							</li>
							<li>
								<strong>Information Technology</strong>
							</li>
						</ol>
						<div className="flex gap-1 text-muted-solid">
							<ThumbsUp className="size-3.5" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
);

export default function Index() {
	const { accountDeleted } = useLoaderData<typeof loader>();

	return (
		<div className="min-h-dvh">
			<SiteHeader
				action={<GoogleSignIn className="h-9 px-3.5 text-sm" label="Sign in" />}
			/>

			<main>
				{accountDeleted && (
					<div
						role="status"
						className="border-b border-success bg-success-app-subtle px-4 py-3 text-center text-sm text-success-high-contrast"
					>
						Your account and all of your data have been permanently deleted.
					</div>
				)}
				<section className="relative overflow-hidden">
					<div className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-gradient-to-b from-primary-element to-transparent opacity-60" />
					<div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:pt-24">
						<div className="text-center lg:text-left">
							<span className="inline-flex items-center gap-2 rounded-full border border-muted bg-surface px-3 py-1 text-xs text-muted-base shadow-card">
								<span className="size-1.5 rounded-full bg-success-solid" />
								Powered by NVIDIA NIM and Neon
							</span>
							<h1 className="mt-6 text-4xl font-semibold tracking-tight text-muted-high-contrast text-balance sm:text-5xl lg:text-6xl">
								Chat with your documents.{" "}
								<span className="bg-gradient-to-r from-[#4F6BFF] to-[#9B5CFF] bg-clip-text text-transparent">
									Get answers in seconds.
								</span>
							</h1>
							<p className="mx-auto mt-5 max-w-xl text-base text-muted-base text-pretty sm:text-lg lg:mx-0">
								Upload a PDF and ask it anything. {APP_NAME} finds the right
								passages and writes clear answers, using a private vector
								database that belongs only to you.
							</p>
							<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
								<GoogleSignIn />
								<a
									href="#how-it-works"
									className="inline-flex h-11 items-center px-4 text-sm font-medium text-muted-base outline-none hover:text-muted-high-contrast focus-visible:underline"
								>
									See how it works
								</a>
							</div>
							<p className="mt-4 text-xs text-muted-solid">
								Free to try: 3 documents and 50 messages a day.
							</p>
						</div>
						<HeroPreview />
					</div>
				</section>

				<section className="border-t border-muted bg-muted-app-subtle py-20">
					<div className="mx-auto max-w-6xl px-4 sm:px-8">
						<h2 className="text-center text-2xl font-semibold tracking-tight text-muted-high-contrast sm:text-3xl">
							Built for answers you can trust
						</h2>
						<div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
							{features.map(({ Icon, title, text }) => (
								<div
									key={title}
									className="rounded-2xl border border-muted bg-surface p-5 shadow-card"
								>
									<span className="flex size-10 items-center justify-center rounded-xl bg-primary-element text-primary-base">
										<Icon className="size-5" />
									</span>
									<h3 className="mt-4 font-semibold text-muted-high-contrast">
										{title}
									</h3>
									<p className="mt-1.5 text-sm text-muted-base">{text}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="how-it-works" className="scroll-mt-16 py-20">
					<div className="mx-auto max-w-4xl px-4 sm:px-8">
						<h2 className="text-center text-2xl font-semibold tracking-tight text-muted-high-contrast sm:text-3xl">
							How it works
						</h2>
						<ol className="mt-12 grid gap-8 sm:grid-cols-3">
							{steps.map(({ Icon, title, text }, i) => (
								<li key={title} className="text-center">
									<span className="relative mx-auto flex size-12 items-center justify-center rounded-2xl border border-muted bg-surface text-primary-base shadow-card">
										<Icon className="size-5" />
										<span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary-solid text-[11px] font-semibold text-white">
											{i + 1}
										</span>
									</span>
									<h3 className="mt-4 font-semibold text-muted-high-contrast">
										{title}
									</h3>
									<p className="mt-1 text-sm text-muted-base">{text}</p>
								</li>
							))}
						</ol>
						<div className="mt-14 flex justify-center">
							<GoogleSignIn label="Get started with Google" />
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-muted py-8">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-solid sm:flex-row sm:px-8">
					<span className="inline-flex items-center gap-2">
						<LogoMark className="size-5" /> {APP_NAME}
					</span>
					<span>
						Answers are AI-generated and can be wrong. Check important details.
					</span>
				</div>
			</footer>
		</div>
	);
}
