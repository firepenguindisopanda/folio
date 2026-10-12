import { relations, type InferSelectModel } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	userId: varchar("user_id", { length: 256 }).notNull().unique(),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	avatarUrl: text("avatar_url"),
	thinkingEnabled: boolean("thinking_enabled").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type User = InferSelectModel<typeof users>;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const documents = pgTable(
	"documents",
	{
		id: serial("id").primaryKey(),
		documentId: varchar("document_id", { length: 256 }).notNull().unique(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 255 }).notNull(),
		fileName: text("file_name").notNull(),
		summary: text("summary"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => ({
		documentsUserIdx: index("documents_user_id_idx").on(t.userId, t.createdAt),
	}),
);

export type Document = InferSelectModel<typeof documents>;

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export const vectorDatabases = pgTable("vector_databases", {
	id: serial("id").primaryKey(),
	vectorDbId: varchar("vector_db_id", { length: 256 }).notNull().unique(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type VectorDatabase = InferSelectModel<typeof vectorDatabases>;

export const insertVectorDatabaseSchema = createInsertSchema(vectorDatabases);
export const selectVectorDatabaseSchema = createSelectSchema(vectorDatabases);

export const chats = pgTable(
	"chats",
	{
		id: serial("id").primaryKey(),
		chatId: varchar("chat_id", { length: 256 }).notNull().unique(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		documentId: integer("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 255 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => ({
		chatsUserIdx: index("chats_user_id_idx").on(t.userId, t.updatedAt),
		chatsDocumentIdx: index("chats_document_id_idx").on(t.documentId),
	}),
);

export type Chat = InferSelectModel<typeof chats>;

export const messages = pgTable(
	"messages",
	{
		id: serial("id").primaryKey(),
		messageId: varchar("message_id", { length: 256 }).notNull().unique(),
		chatId: integer("chat_id")
			.notNull()
			.references(() => chats.id, { onDelete: "cascade" }),
		role: varchar("role", { length: 16 })
			.$type<"user" | "assistant">()
			.notNull(),
		content: text("content").notNull(),
		reasoning: text("reasoning"),
		feedback: varchar("feedback", { length: 8 }).$type<"up" | "down">(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(t) => ({
		messagesChatIdx: index("messages_chat_id_idx").on(t.chatId, t.createdAt),
	}),
);

export type ChatMessage = InferSelectModel<typeof messages>;
