import { Link, useOutletContext } from "@remix-run/react";
import { Menu as MenuIcon } from "lucide-react";
import { Logo } from "~/components/brand/logo";

export type AppOutletContext = { openSidebar: () => void };

export const useAppLayout = () => useOutletContext<AppOutletContext>();

export const OpenSidebarButton = () => {
	const { openSidebar } = useAppLayout();
	return (
		<button
			type="button"
			onClick={openSidebar}
			aria-label="Open menu"
			className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-base outline-none hover:bg-muted-element-hover hover:text-muted-high-contrast focus-visible:ring-2 focus-visible:ring-primary-active lg:hidden"
		>
			<MenuIcon className="size-5" />
		</button>
	);
};

export const MobileTopBar = () => (
	<div className="flex h-14 shrink-0 items-center gap-2 border-b border-muted px-3 lg:hidden">
		<OpenSidebarButton />
		<Link to="/documents" aria-label="Dashboard">
			<Logo markClassName="size-7" />
		</Link>
	</div>
);
