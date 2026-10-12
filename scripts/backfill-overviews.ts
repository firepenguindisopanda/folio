import { eq, isNull } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";
import { db } from "~/lib/db";
import { documents } from "~/lib/db/schema";
import { getFileUrl } from "~/lib/files.server";
import { generateDocumentOverview } from "~/lib/overview.server";

const pending = await db
	.select()
	.from(documents)
	.where(isNull(documents.summary));

console.log(`Documents without an overview: ${pending.length}`);

for (const document of pending) {
	try {
		const buffer = await fetch(await getFileUrl(document.fileName)).then(
			(res) => res.arrayBuffer(),
		);
		const { text } = await extractText(
			await getDocumentProxy(new Uint8Array(buffer)),
			{ mergePages: true },
		);
		const summary = await generateDocumentOverview(document.title, text);
		if (!summary) throw new Error("no overview returned");
		await db
			.update(documents)
			.set({ summary })
			.where(eq(documents.id, document.id));
		console.log(`done: ${document.title}`);
	} catch (error) {
		console.error(`failed: ${document.title}`, error);
		process.exitCode = 1;
	}
}

process.exit();
