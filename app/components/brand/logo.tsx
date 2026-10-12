import { useId } from "react";
import { APP_NAME } from "~/lib/constants";
import { cn } from "~/lib/utils/cn";

export const LogoMark = ({ className }: { className?: string }) => {
	const gradientId = useId();

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 64 64"
			className={cn("size-8 shrink-0", className)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient
					id={gradientId}
					x1="0"
					y1="0"
					x2="64"
					y2="64"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#4F6BFF" />
					<stop offset="1" stopColor="#9B5CFF" />
				</linearGradient>
			</defs>
			<rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
			<path
				d="M21 13h14.5L46 23.5V47a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4z"
				fill="#fff"
			/>
			<path d="M35.5 13v7.5a3 3 0 0 0 3 3H46z" fill="#C7CCFF" />
			<path
				d="M23.5 30h14M23.5 36.5h9"
				stroke="#6366F1"
				strokeWidth="3.2"
				strokeLinecap="round"
			/>
			<path
				d="M47 35c.9 4.6 3.9 7.6 8.5 8.5-4.6.9-7.6 3.9-8.5 8.5-.9-4.6-3.9-7.6-8.5-8.5 4.6-.9 7.6-3.9 8.5-8.5z"
				fill="#FFC53D"
				stroke="#fff"
				strokeWidth="2.5"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export const Logo = ({
	className,
	markClassName,
}: { className?: string; markClassName?: string }) => (
	<span className={cn("inline-flex items-center gap-2.5", className)}>
		<LogoMark className={markClassName} />
		<span className="text-lg font-semibold tracking-tight text-muted-high-contrast">
			{APP_NAME}
		</span>
	</span>
);
