import { useState } from "react";
import {
	Dialog as ReactAriaDialog,
	Heading,
	Input,
	Modal,
	ModalOverlay,
	TextField,
} from "react-aria-components";
import { cn } from "../../lib/utils/cn";
import { Button } from "./button";

type DialogProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	description?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
};

export const Dialog = ({
	isOpen,
	onOpenChange,
	title,
	description,
	children,
	className,
}: DialogProps) => (
	<ModalOverlay
		isOpen={isOpen}
		onOpenChange={onOpenChange}
		isDismissable
		className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out"
	>
		<Modal
			className={cn(
				"w-full max-w-md rounded-2xl border border-muted bg-surface p-6 shadow-2xl outline-none",
				"entering:animate-in entering:zoom-in-95 entering:fade-in exiting:animate-out exiting:zoom-out-95 exiting:fade-out",
				className,
			)}
		>
			<ReactAriaDialog className="outline-none">
				<Heading
					slot="title"
					className="text-base font-semibold text-muted-high-contrast"
				>
					{title}
				</Heading>
				{description && (
					<div className="mt-2 text-sm text-muted-base">{description}</div>
				)}
				{children}
			</ReactAriaDialog>
		</Modal>
	</ModalOverlay>
);

export const ConfirmDialog = ({
	confirmLabel,
	onConfirm,
	...props
}: Omit<DialogProps, "children"> & {
	confirmLabel: string;
	onConfirm: () => Promise<void> | void;
}) => {
	const [pending, setPending] = useState(false);

	return (
		<Dialog {...props}>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="ghost" onPress={() => props.onOpenChange(false)}>
					Cancel
				</Button>
				<Button
					variant="danger"
					isDisabled={pending}
					onPress={async () => {
						setPending(true);
						try {
							await onConfirm();
							props.onOpenChange(false);
						} finally {
							setPending(false);
						}
					}}
				>
					{pending ? "Deleting..." : confirmLabel}
				</Button>
			</div>
		</Dialog>
	);
};

export const RenameDialog = ({
	initialValue,
	onSave,
	...props
}: Omit<DialogProps, "children"> & {
	initialValue: string;
	onSave: (value: string) => Promise<void> | void;
}) => {
	const [value, setValue] = useState(initialValue);
	const [pending, setPending] = useState(false);

	const save = async () => {
		if (!value.trim()) return;
		setPending(true);
		try {
			await onSave(value.trim());
			props.onOpenChange(false);
		} finally {
			setPending(false);
		}
	};

	return (
		<Dialog {...props}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					save();
				}}
			>
				<TextField
					aria-label="Chat name"
					value={value}
					onChange={setValue}
					maxLength={80}
					autoFocus
					className="mt-4"
				>
					<Input className="w-full rounded-lg border border-muted bg-muted-app px-3 py-2 text-sm text-muted-high-contrast outline-none focus:border-primary-solid focus:ring-2 focus:ring-primary-element-active" />
				</TextField>
				<div className="mt-6 flex justify-end gap-2">
					<Button variant="ghost" onPress={() => props.onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						isDisabled={pending || !value.trim()}
					>
						Save
					</Button>
				</div>
			</form>
		</Dialog>
	);
};
