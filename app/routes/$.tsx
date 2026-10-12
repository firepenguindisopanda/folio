import type { MetaFunction } from "@remix-run/node";
import { Link, useLocation } from "@remix-run/react";
import { LogoMark } from "~/components/brand/logo";
import { APP_NAME } from "~/lib/constants";

export const meta: MetaFunction = () => [
	{ title: `Page not found | ${APP_NAME}` },
];

export async function loader() {
	throw new Response("Not found", { status: 404 });
}

export default function NotFound() {
	return <ErrorBoundary />;
}

export function ErrorBoundary() {
	const location = useLocation();

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
			<LogoMark className="size-12" />
			<p className="mt-8 text-sm font-semibold text-primary-base">404</p>
			<h1 className="mt-2 text-3xl font-semibold tracking-tight text-muted-high-contrast">
				Page not found
			</h1>
			<p className="mt-2 max-w-sm break-all text-sm text-muted-base">
				Nothing lives at {location.pathname}.
			</p>
			<Link
				to="/"
				className="mt-8 inline-flex h-10 items-center rounded-lg bg-primary-solid px-5 text-sm font-medium text-white outline-none hover:bg-primary-solid-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-muted-app"
			>
				Go home
			</Link>
		</div>
	);
}
