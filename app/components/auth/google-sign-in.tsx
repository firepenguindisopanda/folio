import { Form } from "@remix-run/react";
import { Google } from "~/components/icons/google";
import { cn } from "~/lib/utils/cn";

export const GoogleSignIn = ({
	className,
	label = "Continue with Google",
}: { className?: string; label?: string }) => (
	<Form action="/api/auth/google" method="POST">
		<button
			type="submit"
			className={cn(
				"inline-flex items-center justify-center gap-2.5 rounded-xl border border-muted bg-surface font-medium text-muted-high-contrast shadow-card outline-none transition-colors hover:bg-muted-element-hover focus-visible:ring-2 focus-visible:ring-primary-active focus-visible:ring-offset-2 focus-visible:ring-offset-muted-app",
				className ?? "h-11 px-5 text-sm",
			)}
		>
			<Google className="size-4" />
			{label}
		</button>
	</Form>
);
