import { json, type ActionFunctionArgs } from "@remix-run/node";
import { count, eq } from "drizzle-orm";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { authenticator } from "~/lib/auth";
import { MAX_FILE_COUNT } from "~/lib/constants";
import { db } from "~/lib/db";
import { documents } from "~/lib/db/schema";
import { generateId } from "~/lib/db/utils/generate-id";
import { deleteFiles, getFileUrl } from "~/lib/files.server";
import { minuteLimiter } from "~/lib/limits.server";
import { generateDocumentOverview } from "~/lib/overview.server";
import { clearUpload, isUploadOwnedBy } from "~/lib/uploads.server";
import {
	deleteDocumentEmbeddings,
	getVectorStore,
} from "~/lib/vector-db/store.server";

const bodySchema = z.object({
	filename: z.string().min(1).max(512),
	title: z.string().min(1).max(255),
});

class ProcessingError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const user = await authenticator.isAuthenticated(request);

	if (!user) {
		return json(
			{ error: "Your session has expired. Please sign in again." },
			401,
		);
	}

	const { success } = await minuteLimiter.limit(`user:${user.id}`);

	if (!success) {
		return json(
			{ error: "Too many requests. Please wait a minute and try again." },
			429,
		);
	}

	const parsed = bodySchema.safeParse(await request.json().catch(() => null));

	if (!parsed.success) {
		return json({ error: "Invalid request" }, 400);
	}

	const { filename, title } = parsed.data;

	if (!(await isUploadOwnedBy(filename, user.id))) {
		return json(
			{ error: "That upload wasn't found. Please upload the file again." },
			403,
		);
	}

	const documentId = generateId({ object: "document" });
	let embeddingsWritten = false;

	try {
		const buffer = await fetch(await getFileUrl(filename)).then((res) =>
			res.arrayBuffer(),
		);
		const pdf = await getDocumentProxy(new Uint8Array(buffer));
		const { text } = await extractText(pdf, { mergePages: true });

		if (!text.trim()) {
			throw new ProcessingError(
				"No text could be read from this PDF. Scanned or image-only PDFs aren't supported yet.",
				422,
			);
		}

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 100,
		});

		const chunks = await splitter.splitDocuments([
			new Document({ pageContent: text, metadata: { documentId } }),
		]);

		const documentTitle = title.replace(/\.pdf$/i, "");
		const vectorStore = await getVectorStore(user.vectorDbId);
		embeddingsWritten = true;
		const [summary] = await Promise.all([
			generateDocumentOverview(documentTitle, text),
			vectorStore.addDocuments(chunks),
		]);

		const document = await db.transaction(async (tx) => {
			const [{ total }] = await tx
				.select({ total: count() })
				.from(documents)
				.where(eq(documents.userId, user.id));

			if (total >= MAX_FILE_COUNT) {
				throw new ProcessingError(
					`You've reached the limit of ${MAX_FILE_COUNT} documents. Delete one to upload another.`,
					403,
				);
			}

			const [inserted] = await tx
				.insert(documents)
				.values({
					documentId,
					userId: user.id,
					title: documentTitle,
					fileName: filename,
					summary,
				})
				.returning();
			return inserted;
		});

		await clearUpload(filename);

		return json({ document }, 201);
	} catch (error) {
		console.error("Document processing error:", error);

		await Promise.allSettled([
			embeddingsWritten
				? deleteDocumentEmbeddings(user.vectorDbId, documentId)
				: Promise.resolve(),
			deleteFiles([filename]),
			clearUpload(filename),
		]);

		if (error instanceof ProcessingError) {
			return json({ error: error.message }, error.status);
		}
		return json(
			{ error: "We couldn't process that PDF. Please try again." },
			500,
		);
	}
};
