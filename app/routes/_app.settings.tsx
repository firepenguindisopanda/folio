import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Brain, LogOut, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileTopBar } from "~/components/layout/app-layout-context";
import { ThemeSwitcher } from "~/components/layout/theme-switcher";
import { DeleteAccount } from "~/components/settings/delete-account";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Meter } from "~/components/ui/meter";
import { Switch } from "~/components/ui/switch";
import { useAppData } from "~/hooks/use-app-data";
import { authenticator } from "~/lib/auth";
import { getFeedbackCounts } from "~/lib/chats.server";
import { APP_NAME, MESSAGES_PER_MINUTE } from "~/lib/constants";
import { timeUntil } from "~/lib/utils/format";

export const meta: MetaFunction = () => [{ title: `Settings | ${APP_NAME}` }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});
	return json({ feedback: await getFeedbackCounts(user.id) });
};

const Section = ({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) => (
	<section className="rounded-2xl border border-muted bg-surface p-5 shadow-card sm:p-6">
		<h2 className="font-semibold text-muted-high-contrast">{title}</h2>
		{description && (
			<p className="mt-1 text-sm text-muted-base">{description}</p>
		)}
		<div className="mt-5">{children}</div>
	</section>
);

export default function SettingsPage() {
	const { feedback } = useLoaderData<typeof loader>();
	const { user, settings, usage, documents } = useAppData();
	const [thinking, setThinking] = useState(settings.thinkingEnabled);

	const saveThinking = async (value: boolean) => {
		setThinking(value);
		const res = await fetch("/api/settings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ thinkingEnabled: value }),
		}).catch(() => null);
		if (res?.ok) {
			toast.success(
				value
					? "Thinking is on for new chats"
					: "Thinking is off for new chats",
			);
		} else {
			setThinking(!value);
			toast.error("Couldn't save that setting. Please try again.");
		}
	};

	return (
		<>
			<MobileTopBar />
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-muted-high-contrast sm:text-3xl">
							Settings
						</h1>
						<p className="mt-1 text-sm text-muted-base">
							Personalise how {APP_NAME} looks and answers.
						</p>
					</div>

					<Section
						title="Appearance"
						description="Choose a theme, or follow your device."
					>
						<ThemeSwitcher showLabels className="w-full max-w-sm" />
					</Section>

					<Section
						title="AI answers"
						description="You can also switch this per message with the Think button in a chat."
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-element text-primary-base">
									<Brain className="size-4" />
								</span>
								<div>
									<p className="text-sm font-medium text-muted-high-contrast">
										Thinking mode
									</p>
									<p className="mt-0.5 text-sm text-muted-base">
										The AI reasons step by step before answering, and you can
										read its thinking. Slower, but better for complex questions.
									</p>
								</div>
							</div>
							<Switch
								isSelected={thinking}
								onChange={saveThinking}
								aria-label="Thinking mode"
							/>
						</div>
					</Section>

					<Section title="Usage & limits">
						<div className="space-y-5">
							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span className="text-muted-high-contrast">
										Messages today
									</span>
									<span className="tabular-nums">
										{usage.daily.used} / {usage.daily.limit}
									</span>
								</div>
								<Meter
									value={usage.daily.used}
									max={usage.daily.limit}
									label="Messages used today"
								/>
								<p
									className="mt-1.5 text-xs text-muted-base"
									suppressHydrationWarning
								>
									Resets daily at midnight UTC (in{" "}
									{timeUntil(usage.daily.reset)}
									). Up to {MESSAGES_PER_MINUTE} messages per minute.
								</p>
							</div>
							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span className="text-muted-high-contrast">Documents</span>
									<span className="tabular-nums">
										{usage.documents.used} / {usage.documents.limit}
									</span>
								</div>
								<Meter
									value={usage.documents.used}
									max={usage.documents.limit}
									label="Documents used"
								/>
								<p className="mt-1.5 text-xs text-muted-base">
									Delete a document to free up a slot.
								</p>
							</div>
							<div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-muted pt-4 text-sm">
								<span className="inline-flex items-center gap-1.5">
									<ThumbsUp className="size-4 text-success-base" />
									{feedback.up} answers rated helpful
								</span>
								<span className="inline-flex items-center gap-1.5">
									<ThumbsDown className="size-4 text-danger-base" />
									{feedback.down} not helpful
								</span>
							</div>
						</div>
					</Section>

					<Section title="Account">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div className="flex min-w-0 items-center gap-3">
								<Avatar className="size-10">
									<AvatarImage src={user.avatarUrl ?? undefined} alt="" />
									<AvatarFallback className="bg-primary-element text-primary-high-contrast">
										{user.name?.charAt(0) ?? "?"}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-muted-high-contrast">
										{user.name}
									</p>
									<p className="truncate text-sm text-muted-base">
										{user.email}
									</p>
								</div>
							</div>
							<Form method="post" action="/api/auth/logout">
								<button
									type="submit"
									className="inline-flex h-9 items-center gap-2 rounded-lg border border-muted px-3 text-sm text-muted-high-contrast outline-none transition-colors hover:bg-muted-element-hover focus-visible:ring-2 focus-visible:ring-primary-active"
								>
									<LogOut className="size-4" /> Sign out
								</button>
							</Form>
						</div>
					</Section>

					<DeleteAccount
						email={user.email}
						documentCount={documents.length}
						chatCount={documents.reduce((sum, d) => sum + d.chats.length, 0)}
					/>
				</div>
			</div>
		</>
	);
}
