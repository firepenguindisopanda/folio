import { Link } from "@remix-run/react";
import { Logo } from "~/components/brand/logo";
import { ThemeSwitcher } from "./theme-switcher";

export const SiteHeader = ({ action }: { action?: React.ReactNode }) => (
	<header className="sticky top-0 z-30 border-b border-muted bg-muted-app/80 backdrop-blur-xl">
		<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
			<Link
				to="/"
				aria-label="Home"
				className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-active"
			>
				<Logo />
			</Link>
			<div className="flex items-center gap-3">
				<ThemeSwitcher className="hidden sm:inline-flex" />
				{action}
			</div>
		</div>
	</header>
);
