import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { LogoMark } from "~/components/brand/logo";
import { authenticator } from "~/lib/auth";
import { commitSession, getSession } from "~/lib/auth/session.server";
import { APP_NAME } from "~/lib/constants";
import { GoogleSignIn } from "~/components/auth/google-sign-in";

export const meta: MetaFunction = () => [{ title: `Sign in | ${APP_NAME}` }];

export async function loader({ request }: LoaderFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		successRedirect: "/documents",
	});

	const session = await getSession(request.headers.get("cookie"));
	const error = session.get(authenticator.sessionErrorKey) as
		| { message?: string }
		| string
		| undefined;

	return json(
		{ error: typeof error === "string" ? error : (error?.message ?? null) },
		{
			headers: {
				// Commit the session whenever a flash value is read
				"Set-Cookie": await commitSession(session),
			},
		},
	);
}

export default function Login() {
	const { error } = useLoaderData<typeof loader>();

	return (
		<div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
			<div className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#4F6BFF] to-[#9B5CFF] opacity-15 blur-3xl" />
			<div className="relative w-full max-w-sm rounded-2xl border border-muted bg-surface p-8 text-center shadow-2xl">
				<Link to="/" aria-label="Home" className="inline-block">
					<LogoMark className="mx-auto size-12" />
				</Link>
				<h1 className="mt-5 text-xl font-semibold tracking-tight text-muted-high-contrast">
					Welcome to {APP_NAME}
				</h1>
				<p className="mt-1.5 text-sm text-muted-base">
					Sign in to chat with your documents.
				</p>

				{error && (
					<div
						role="alert"
						className="mt-6 flex items-start gap-2.5 rounded-xl border border-danger bg-danger-app-subtle p-3 text-left text-sm text-danger-high-contrast"
					>
						<AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-base" />
						<span>{error}</span>
					</div>
				)}

				<div className="mt-7">
					<GoogleSignIn className="h-11 w-full text-sm" />
				</div>
				<p className="mt-6 text-xs text-muted-solid">
					New here? Signing in creates your account and your private document
					database.
				</p>
			</div>
		</div>
	);
}
