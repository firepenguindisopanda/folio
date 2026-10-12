import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import postgres from "postgres";
import { createEmbeddings } from "~/lib/ai.server";
import type { DocRef } from "~/lib/doc-refs";
import { neonApi } from "~/lib/vector-db";

export const getVectorDbUri = async (vectorDbId: string) => {
	const { data, error } = await neonApi.getConnectionUri(vectorDbId);

	if (!data) {
		throw new Error(
			`Failed to get vector database connection, ${JSON.stringify(error)}`,
		);
	}

	return data.uri;
};

export const getVectorStore = async (vectorDbId: string) =>
	NeonPostgres.initialize(createEmbeddings(), {
		connectionString: await getVectorDbUri(vectorDbId),
		tableName: "embeddings",
		columns: {
			contentColumnName: "content",
			metadataColumnName: "metadata",
			vectorColumnName: "embedding",
		},
	});

export const withTenantSql = async <T>(
	vectorDbId: string,
	fn: (sql: postgres.Sql) => Promise<T>,
) => {
	const sql = postgres(await getVectorDbUri(vectorDbId), {
		max: 1,
		onnotice: () => {},
	});
	try {
		return await fn(sql);
	} finally {
		await sql.end();
	}
};

export const deleteDocumentEmbeddings = (
	vectorDbId: string,
	documentId: string,
) =>
	withTenantSql(
		vectorDbId,
		(sql) =>
			sql`DELETE FROM embeddings WHERE metadata->>'documentId' = ${documentId}`,
	);

type OutlineChunk = { id: number; content: string };

export const findOutlineChunks = (
	vectorDbId: string,
	documentId: string,
	refs: DocRef[],
) =>
	withTenantSql(vectorDbId, async (sql) => {
		const found = new Map<number, string>();
		const add = (rows: OutlineChunk[]) => {
			for (const row of rows) found.set(row.id, row.content);
		};
		const byIds = (ids: number[]) =>
			sql<OutlineChunk[]>`
				SELECT id, content FROM embeddings
				WHERE metadata->>'documentId' = ${documentId} AND id IN ${sql(ids)}`;

		const contentsFor = async (chapter: number) => {
			const score = Array.from(
				{ length: 6 },
				(_, i) => `(^|[^0-9.])${chapter}\\.${i + 1}\\s+[A-Z]`,
			).reduce<postgres.PendingQuery<postgres.Row[]> | null>(
				(acc, pattern) =>
					acc
						? sql`${acc} + (content ~ ${pattern})::int`
						: sql`(content ~ ${pattern})::int`,
				null,
			);
			const outlineMarker = `\\mContents\\M|Chapter\\s+${chapter}\\M`;
			return sql<OutlineChunk[]>`
				SELECT id, content FROM (
					SELECT id, content, ${score} AS headings,
						(content ~ ${outlineMarker})::int * 2 AS bonus
					FROM embeddings
					WHERE metadata->>'documentId' = ${documentId}
				) scored
				WHERE headings >= 2
				ORDER BY headings + bonus DESC, id
				LIMIT 2`;
		};

		const chapterTitles = new Set<string>();

		for (const ref of refs) {
			const tocEntries = await sql<OutlineChunk[]>`
				SELECT id, content FROM embeddings
				WHERE metadata->>'documentId' = ${documentId}
					AND content ~ ${`Chapter\\s+${ref.chapter}\\s+[A-Z]`}
				ORDER BY id
				LIMIT 3`;
			const chapterTitlePattern = new RegExp(
				`Chapter\\s+${ref.chapter}\\s+([A-Z][^\\d]{2,80}?)\\s+\\d`,
			);
			const chapterTitle = tocEntries
				.map((entry) => entry.content.match(chapterTitlePattern)?.[1]?.trim())
				.find(Boolean);
			if (chapterTitle) chapterTitles.add(chapterTitle);

			const contents = await contentsFor(ref.chapter);
			if (contents.length === 0) {
				add(tocEntries.slice(0, 1));
				continue;
			}
			add(contents);
			const opening = contents.reduce((a, b) => (b.id > a.id ? b : a));

			if (ref.kind === "chapter") {
				add(await byIds([opening.id - 1]));
				continue;
			}

			const titlePattern = new RegExp(
				`(?:^|[^0-9.])${ref.chapter}\\.${ref.section}\\s+([A-Z][^\\d]{2,80}?)(?=\\s+\\d|\\s*$)`,
			);
			const title = contents
				.map((c) => c.content.match(titlePattern)?.[1])
				.find(Boolean)
				?.trim();
			if (!title) continue;

			const headingPattern = `${ref.chapter}\\.${ref.section}\\s+${title
				.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
				.replace(/\s+/g, "\\s+")}`;
			const [sectionStart] = await sql<OutlineChunk[]>`
				SELECT id, content FROM embeddings
				WHERE metadata->>'documentId' = ${documentId}
					AND id > ${opening.id}
					AND content ~ ${headingPattern}
				ORDER BY id
				LIMIT 1`;
			if (sectionStart) {
				add(await byIds([sectionStart.id, sectionStart.id + 1]));
			}
		}

		return {
			passages: [...found.entries()]
				.sort(([a], [b]) => a - b)
				.map(([, content]) => content)
				.slice(0, 6),
			chapterTitles: [...chapterTitles],
		};
	});

export const getLastChapterNumber = (vectorDbId: string, documentId: string) =>
	withTenantSql(vectorDbId, async (sql) => {
		const [row] = await sql<{ last: number | null }[]>`
			SELECT max(chapter) AS last FROM (
				SELECT (match)[1]::int AS chapter
				FROM embeddings,
					regexp_matches(content, 'Chapter\\s+(\\d{1,3})\\M', 'g') AS match
				WHERE metadata->>'documentId' = ${documentId}
				GROUP BY 1
				HAVING count(*) >= 2
			) chapters`;
		return row?.last ?? null;
	});
