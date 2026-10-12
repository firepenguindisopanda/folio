import { useNavigate } from "@remix-run/react";
import {
	AlertCircle,
	Check,
	FileUp,
	Loader2,
	RotateCcw,
	UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import {
	DropZone,
	FileTrigger,
	type FileDropItem,
} from "react-aria-components";
import { Button } from "~/components/ui/button";
import { MAX_FILE_SIZE } from "~/lib/constants";
import { useUploadThing } from "~/lib/uploadthing";
import { cn } from "~/lib/utils/cn";

type Stage =
	| { kind: "idle" }
	| { kind: "uploading"; name: string; progress: number }
	| { kind: "processing"; name: string }
	| { kind: "done"; name: string }
	| { kind: "error"; message: string };

const Step = ({
	state,
	label,
	detail,
}: {
	state: "done" | "active" | "pending";
	label: string;
	detail?: React.ReactNode;
}) => (
	<li className="flex gap-3">
		<span
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
				state === "done" && "border-success-solid bg-success-solid text-white",
				state === "active" && "border-primary-solid text-primary-base",
				state === "pending" && "border-muted text-muted-solid",
			)}
		>
			{state === "done" ? (
				<Check className="size-3.5" />
			) : state === "active" ? (
				<Loader2 className="size-3.5 animate-spin" />
			) : null}
		</span>
		<div className="min-w-0 flex-1 pb-1">
			<p
				className={cn(
					"text-sm font-medium",
					state === "pending" ? "text-muted-solid" : "text-muted-high-contrast",
				)}
			>
				{label}
			</p>
			{detail && <div className="mt-1 text-xs text-muted-base">{detail}</div>}
		</div>
	</li>
);

export const Upload = ({ className }: { className?: string }) => {
	const navigate = useNavigate();
	const [stage, setStage] = useState<Stage>({ kind: "idle" });
	const uploadError = useRef<Error | undefined>();
	const { startUpload } = useUploadThing("pdfUploader", {
		onUploadProgress: (progress) =>
			setStage((s) => (s.kind === "uploading" ? { ...s, progress } : s)),
		onUploadError: (error) => {
			uploadError.current = error;
		},
	});

	const handleFile = async (file: File) => {
		if (file.type !== "application/pdf") {
			setStage({ kind: "error", message: "Only PDF files are supported." });
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			setStage({
				kind: "error",
				message: "That file is larger than 10 MB. Try a smaller PDF.",
			});
			return;
		}

		uploadError.current = undefined;
		setStage({ kind: "uploading", name: file.name, progress: 0 });
		const [uploaded] = (await startUpload([file])) ?? [];

		if (!uploaded) {
			setStage({
				kind: "error",
				message:
					(uploadError.current as Error | undefined)?.message ??
					"The upload failed. Please try again.",
			});
			return;
		}

		setStage({ kind: "processing", name: file.name });

		const res = await fetch("/api/document/vectorize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename: uploaded.key, title: uploaded.name }),
		}).catch(() => null);
		const body = await res?.json().catch(() => ({}));

		if (!res?.ok) {
			setStage({
				kind: "error",
				message:
					body?.error ?? "We couldn't process that PDF. Please try again.",
			});
			return;
		}

		setStage({ kind: "done", name: file.name });
		navigate(`/documents/${body.document.documentId}/chat`);
	};

	if (stage.kind === "idle" || stage.kind === "error") {
		return (
			<div className={className}>
				{stage.kind === "error" && (
					<div
						role="alert"
						className="mb-4 flex items-start gap-3 rounded-xl border border-danger bg-danger-app-subtle p-4 text-sm"
					>
						<AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-base" />
						<p className="flex-1 text-danger-high-contrast">{stage.message}</p>
					</div>
				)}
				<DropZone
					onDrop={async (e) => {
						const item = e.items.find(
							(i): i is FileDropItem => i.kind === "file",
						);
						if (item) await handleFile(await item.getFile());
					}}
					className={cn(
						"group flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted bg-surface px-6 py-12 text-center outline-none transition-colors",
						"data-[drop-target]:border-primary-solid data-[drop-target]:bg-primary-app-subtle",
						"data-[focus-visible]:ring-2 data-[focus-visible]:ring-primary-active",
					)}
				>
					<span className="flex size-14 items-center justify-center rounded-2xl bg-primary-element text-primary-base transition-transform group-data-[drop-target]:scale-110">
						<UploadCloud className="size-7" />
					</span>
					<div>
						<p className="text-base font-semibold text-muted-high-contrast">
							Drop your PDF here
						</p>
						<p className="mt-1 text-sm text-muted-base">
							PDF up to 10 MB. Text-based PDFs work best.
						</p>
					</div>
					<FileTrigger
						acceptedFileTypes={["application/pdf", ".pdf"]}
						onSelect={async (files) => {
							const file = files?.[0];
							if (file) await handleFile(file);
						}}
					>
						<Button variant="primary" className="gap-2 font-medium">
							{stage.kind === "error" ? (
								<RotateCcw className="size-4" />
							) : (
								<FileUp className="size-4" />
							)}
							{stage.kind === "error" ? "Try another file" : "Choose a file"}
						</Button>
					</FileTrigger>
				</DropZone>
			</div>
		);
	}

	const uploadDone = stage.kind !== "uploading";
	const processingDone = stage.kind === "done";

	return (
		<div
			className={cn(
				"rounded-2xl border border-muted bg-surface p-6 shadow-card sm:p-8",
				className,
			)}
			aria-live="polite"
		>
			<p className="truncate text-base font-semibold text-muted-high-contrast">
				{stage.name}
			</p>
			<p className="mt-1 text-sm text-muted-base">
				Hang tight, we're getting your document ready to chat.
			</p>
			<ol className="mt-6 space-y-4">
				<Step
					state={uploadDone ? "done" : "active"}
					label={uploadDone ? "Uploaded" : "Uploading"}
					detail={
						stage.kind === "uploading" && (
							<div className="flex items-center gap-3">
								<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted-element-active">
									<div
										className="h-full rounded-full bg-primary-solid transition-all"
										style={{ width: `${stage.progress}%` }}
									/>
								</div>
								<span className="tabular-nums">{stage.progress}%</span>
							</div>
						)
					}
				/>
				<Step
					state={processingDone ? "done" : uploadDone ? "active" : "pending"}
					label="Reading and indexing"
					detail={
						stage.kind === "processing" &&
						"Extracting the text and building your private search index. Large PDFs can take a minute."
					}
				/>
				<Step
					state={processingDone ? "active" : "pending"}
					label="Opening your chat"
				/>
			</ol>
		</div>
	);
};
