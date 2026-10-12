import { type DocRef, findDocRefs } from "./doc-refs";
import {
	findOutlineChunks,
	getLastChapterNumber,
	getVectorStore,
} from "./vector-db/store.server";

const chapterOf = (refs: DocRef[]) => refs[0]?.chapter;

const resolveRefs = async ({
	vectorDbId,
	documentId,
	question,
	previousQuestion,
}: {
	vectorDbId: string;
	documentId: string;
	question: string;
	previousQuestion?: string;
}): Promise<DocRef[]> => {
	const current = findDocRefs(question);
	const previous = findDocRefs(previousQuestion ?? "");

	if (current.positions.length === 0) {
		return current.refs.length > 0 ? current.refs : previous.refs;
	}

	const refs = [...current.refs];
	const previousChapter = chapterOf(previous.refs);

	for (const position of current.positions) {
		if (position === "first") refs.push({ kind: "chapter", chapter: 1 });
		if (position === "next" && previousChapter) {
			refs.push({ kind: "chapter", chapter: previousChapter + 1 });
		}
		if (position === "previous" && previousChapter && previousChapter > 1) {
			refs.push({ kind: "chapter", chapter: previousChapter - 1 });
		}
		if (position === "last") {
			const last = await getLastChapterNumber(vectorDbId, documentId);
			if (last) refs.push({ kind: "chapter", chapter: last });
		}
	}

	return refs.slice(0, 2);
};

export const retrieveContext = async ({
	vectorDbId,
	documentId,
	question,
	previousQuestion,
}: {
	vectorDbId: string;
	documentId: string;
	question: string;
	previousQuestion?: string;
}) => {
	const vectorStore = await getVectorStore(vectorDbId);
	const search = (query: string, k: number) =>
		vectorStore.similaritySearch(query, k, { documentId });

	const refs = await resolveRefs({
		vectorDbId,
		documentId,
		question,
		previousQuestion,
	});

	const [direct, withContext, outline] = await Promise.all([
		search(question, 6),
		previousQuestion
			? search(`${previousQuestion}\n${question}`, 3)
			: Promise.resolve([]),
		refs.length > 0
			? findOutlineChunks(vectorDbId, documentId, refs).catch((error) => {
					console.error("Outline lookup failed:", error);
					return { passages: [] as string[], chapterTitles: [] as string[] };
				})
			: Promise.resolve({
					passages: [] as string[],
					chapterTitles: [] as string[],
				}),
	]);

	const fromTitles = (
		await Promise.all(outline.chapterTitles.map((title) => search(title, 4)))
	).flat();

	const excerpts = [
		...new Set(
			[...direct, ...fromTitles, ...withContext].map((s) => s.pageContent),
		),
	].filter((excerpt) => !outline.passages.includes(excerpt));

	return {
		outline: outline.passages,
		chapterTitles: outline.chapterTitles,
		excerpts,
	};
};
