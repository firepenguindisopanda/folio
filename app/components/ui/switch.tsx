import {
	Switch as ReactAriaSwitch,
	type SwitchProps,
} from "react-aria-components";
import { cn } from "../../lib/utils/cn";

export const Switch = ({
	children,
	className,
	...props
}: SwitchProps & { className?: string; children?: React.ReactNode }) => (
	<ReactAriaSwitch
		{...props}
		className={cn("group inline-flex items-center gap-3 text-sm", className)}
	>
		<span
			className={cn(
				"flex h-6 w-10 shrink-0 items-center rounded-full bg-muted-element-active p-0.5 transition-colors",
				"group-data-[selected]:bg-primary-solid",
				"group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-primary-active group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-muted-app",
			)}
		>
			<span className="size-5 rounded-full bg-white shadow transition-transform group-data-[selected]:translate-x-4" />
		</span>
		{children}
	</ReactAriaSwitch>
);
