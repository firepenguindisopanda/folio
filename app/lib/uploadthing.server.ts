import { count, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";
import { authenticator } from "~/lib/auth";
import { MAX_FILE_COUNT, MAX_FILE_SIZE } from "~/lib/constants";
import { db } from "~/lib/db";
import { documents } from "~/lib/db/schema";
import { minuteLimiter } from "~/lib/limits.server";
import { recordUpload } from "~/lib/uploads.server";

const f = createUploadthing();

export const uploadRouter = {
	pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
		.middleware(async ({ event, files }) => {
			const user = await authenticator.isAuthenticated(event.request);

			if (!user) {
				throw new UploadThingError(
					"Your session has expired. Please sign in again.",
				);
			}

			const { success } = await minuteLimiter.limit(`user:${user.id}`);

			if (!success) {
				throw new UploadThingError(
					"Too many requests. Please wait a minute and try again.",
				);
			}

			const userDocuments = await db
				.select({ count: count() })
				.from(documents)
				.where(eq(documents.userId, user.id));

			if (userDocuments[0].count >= MAX_FILE_COUNT) {
				throw new UploadThingError(
					`You've reached the limit of ${MAX_FILE_COUNT} documents. Delete one to upload another.`,
				);
			}

			if (files.some((file) => file.size > MAX_FILE_SIZE)) {
				throw new UploadThingError(
					"File size exceeds the maximum limit of 10 MB",
				);
			}

			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			await recordUpload(file.key, metadata.userId);
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
