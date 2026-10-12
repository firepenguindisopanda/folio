import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import type { loader as rootLoader } from "~/root";
import { cn } from "~/lib/utils/cn";

const options = [
	{ id: "system", label: "System", Icon: Monitor },
	{ id: "light", label: "Light", Icon: Sun },
	{ id: "dark", label: "Dark", Icon: Moon },
] as const;

export const ThemeSwitcher = ({
	className,
	showLabels = false,
}: { className?: string; showLabels?: boolean }) => {
	const fetcher = useFetcher();
	const rootData = useRouteLoaderData<typeof rootLoader>("root");
	const pending = (fetcher.json as { theme?: string } | undefined)?.theme;
	const theme = pending ?? rootData?.theme ?? "system";

	return (
		<ToggleButtonGroup
			aria-label="Theme"
			selectionMode="single"
			disallowEmptySelection
			selectedKeys={[theme]}
			onSelectionChange={(keys) => {
				const [next] = [...keys];
				if (next && next !== theme) {
					fetcher.submit(
						{ theme: String(next) },
						{
							method: "POST",
							action: "/api/settings",
							encType: "application/json",
						},
					);
				}
			}}
			className={cn(
				"inline-flex rounded-lg border border-muted bg-muted-app p-0.5",
				className,
			)}
		>
			{options.map(({ id, label, Icon }) => (
				<ToggleButton
					key={id}
					id={id}
					aria-label={label}
					className={cn(
						"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-base outline-none transition-colors",
						"hover:text-muted-high-contrast data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active",
						"data-[selected]:bg-surface data-[selected]:text-muted-high-contrast data-[selected]:shadow-sm",
					)}
				>
					<Icon className="size-3.5" />
					{showLabels && label}
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
};
