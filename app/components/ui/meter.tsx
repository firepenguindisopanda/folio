import { cn } from "../../lib/utils/cn";

export const Meter = ({
	value,
	max,
	className,
	label,
}: { value: number; max: number; className?: string; label: string }) => {
	const ratio = max > 0 ? Math.min(value / max, 1) : 0;

	return (
		<div
			role="meter"
			aria-label={label}
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
			className={cn(
				"h-1.5 w-full overflow-hidden rounded-full bg-muted-element-active",
				className,
			)}
		>
			<div
				className={cn(
					"h-full rounded-full transition-all duration-500",
					ratio >= 1
						? "bg-danger-solid"
						: ratio >= 0.8
							? "bg-warning-solid"
							: "bg-primary-solid",
				)}
				style={{ width: `${Math.max(ratio * 100, value > 0 ? 4 : 0)}%` }}
			/>
		</div>
	);
};
