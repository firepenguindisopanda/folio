import { type InferSelectModel, sql } from "drizzle-orm";
import {
	pgTable,
	serial,
	text,
	jsonb,
	timestamp,
	index,
	vector,
} from "drizzle-orm/pg-core";

export const embeddings = pgTable(
	"embeddings",
	{
		id: serial("id").primaryKey(),
		content: text("content").notNull(),
		metadata: jsonb("metadata").notNull(),
		embedding: vector("embedding", { dimensions: 1024 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		embeddingIdx: index("embedding_idx").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops"),
		),
		documentIdIdx: index("embeddings_document_id_idx").on(
			sql`(${table.metadata}->>'documentId')`,
		),
	}),
);

export type Embedding = InferSelectModel<typeof embeddings>;
