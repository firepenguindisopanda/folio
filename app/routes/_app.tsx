import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
	Outlet,
	useHref,
	useLoaderData,
	useLocation,
	useNavigate,
} from "@remix-run/react";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Modal, ModalOverlay, RouterProvider } from "react-aria-components";
import type { AppOutletContext } from "~/components/layout/app-layout-context";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { authenticator } from "~/lib/auth";
import { getSidebarDocuments, getUserSettings } from "~/lib/chats.server";
import { MAX_FILE_COUNT } from "~/lib/constants";
import { cn } from "~/lib/utils/cn";
import { getDailyUsage } from "~/lib/limits.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	const [documents, settings, daily] = await Promise.all([
		getSidebarDocuments(user.id),
		getUserSettings(user.id),
		getDailyUsage(user.id),
	]);

	const sidebarCollapsed = /(?:^|;\s*)sidebar=collapsed(?:;|$)/.test(
		request.headers.get("Cookie") ?? "",
	);

	return json({
		sidebarCollapsed,
		user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
		documents,
		settings,
		usage: {
			daily,
			documents: { used: documents.length, limit: MAX_FILE_COUNT },
		},
	});
};

export const shouldRevalidate = () => true;

export default function AppLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { sidebarCollapsed } = useLoaderData<typeof loader>();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(sidebarCollapsed);

	const toggleCollapsed = useCallback(() => {
		setCollapsed((value) => {
			document.cookie = `sidebar=${value ? "expanded" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
			return !value;
		});
	}, []);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleCollapsed();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [toggleCollapsed]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run on route change
	useEffect(() => setSidebarOpen(false), [location.pathname]);

	return (
		<RouterProvider navigate={navigate} useHref={useHref}>
			<div className="flex h-dvh overflow-hidden">
				<aside
					className={cn(
						"hidden shrink-0 overflow-hidden border-r border-muted bg-muted-app-subtle transition-[width] duration-200 ease-out lg:block",
						collapsed ? "w-16" : "w-72",
					)}
				>
					<AppSidebar
						collapsed={collapsed}
						onToggleCollapse={toggleCollapsed}
					/>
				</aside>

				<ModalOverlay
					isOpen={sidebarOpen}
					onOpenChange={setSidebarOpen}
					isDismissable
					className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out lg:hidden"
				>
					<Modal className="h-full w-[85vw] max-w-xs border-r border-muted bg-muted-app-subtle outline-none entering:animate-in entering:slide-in-from-left exiting:animate-out exiting:slide-out-to-left">
						<div className="relative h-full" role="dialog" aria-label="Menu">
							<button
								type="button"
								onClick={() => setSidebarOpen(false)}
								aria-label="Close menu"
								className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-base hover:bg-muted-element-hover hover:text-muted-high-contrast"
							>
								<X className="size-4" />
							</button>
							<AppSidebar />
						</div>
					</Modal>
				</ModalOverlay>

				<main className="flex min-w-0 flex-1 flex-col overflow-hidden">
					<Outlet
						context={
							{
								openSidebar: () => setSidebarOpen(true),
							} satisfies AppOutletContext
						}
					/>
				</main>
			</div>
		</RouterProvider>
	);
}
