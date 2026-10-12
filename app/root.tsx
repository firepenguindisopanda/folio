import {
	Links,
	Meta,
	type MetaFunction,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetchers,
	useRouteLoaderData,
} from "@remix-run/react";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	json,
	type LinksFunction,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { Toaster } from "sonner";
import { GenericErrorBoundary } from "./components/misc/error-boundary";
import { APP_NAME } from "./lib/constants";
import { getTheme, type Theme } from "./lib/theme.server";

const queryClient = new QueryClient();

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
	},
	{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
	{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
	{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export const meta: MetaFunction = () => [
	{ title: `${APP_NAME} | Chat with your documents` },
	{
		name: "description",
		content:
			"Upload a PDF and get instant, grounded answers. Every user gets their own private vector database.",
	},
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	return json({ theme: await getTheme(request) });
};

const usePendingTheme = () => {
	const fetcher = useFetchers().find(
		(f) => f.formAction === "/api/settings" && f.json,
	);
	const theme = (fetcher?.json as { theme?: Theme } | undefined)?.theme;
	return theme;
};

function Document({ children }: { children: React.ReactNode }) {
	const data = useRouteLoaderData<typeof loader>("root");
	const theme = usePendingTheme() ?? data?.theme ?? "system";

	return (
		<html lang="en" data-theme={theme}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
				<Toaster theme={theme} position="top-center" richColors closeButton />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export function ErrorBoundary() {
	return (
		<Document>
			<div className="flex min-h-dvh items-center justify-center p-6">
				<div className="max-w-md rounded-2xl border border-muted bg-surface p-8 text-center shadow-card">
					<h1 className="mb-2 text-lg font-semibold text-muted-high-contrast">
						Something went wrong
					</h1>
					<GenericErrorBoundary />
					<a
						href="/"
						className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary-solid px-4 text-sm font-medium text-white hover:bg-primary-solid-hover"
					>
						Go home
					</a>
				</div>
			</div>
		</Document>
	);
}
