import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { and, eq } from "drizzle-orm";
import postgres from "postgres";
import { db } from "./db";
import { documents, users, vectorDatabases } from "./db/schema";
import { generateId } from "./db/utils/generate-id";
import { deleteFiles } from "./files.server";
import { neonApi } from "./vector-db";
import { deleteDocumentEmbeddings } from "./vector-db/store.server";

export const deleteTenantDatabase = async (vectorDbId: string) => {
	const { error, status } = await neonApi.deleteProject(vectorDbId);
	if (error && status !== 404) {
		throw new Error(
			`Failed to delete tenant database ${vectorDbId}, ${JSON.stringify(error)}`,
		);
	}
};

type Profile = { email: string; name: string; avatarUrl?: string };

export const provisionTenant = async ({ email, name, avatarUrl }: Profile) => {
	const [existing] = await db
		.select({ user: users, vectorDatabase: vectorDatabases })
		.from(users)
		.leftJoin(vectorDatabases, eq(users.id, vectorDatabases.userId))
		.where(eq(users.email, email));

	if (existing?.vectorDatabase) {
		return { ...existing.user, vectorDbId: existing.vectorDatabase.vectorDbId };
	}

	const publicUserId = existing?.user.userId ?? generateId({ object: "user" });

	const { data, error } = await neonApi.createProject({
		project: {
			name: `tenant-${publicUserId}`,
			org_id: process.env.NEON_ORG_ID || undefined,
		},
	});

	if (!data) {
		throw new Error(`Failed to create Neon project, ${JSON.stringify(error)}`);
	}

	const vectorDbId = data.project.id;

	try {
		const sql = postgres(data.connection_uris[0].connection_uri, {
			max: 1,
			onnotice: () => {},
		});
		try {
			await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
			await migrate(drizzle(sql), {
				migrationsFolder: "app/lib/vector-db/migrations",
			});
		} finally {
			await sql.end();
		}

		return await db.transaction(async (tx) => {
			const profile = { name: name.slice(0, 255), avatarUrl };
			const [user] = await tx
				.insert(users)
				.values({ email, userId: publicUserId, ...profile })
				.onConflictDoUpdate({ target: users.email, set: profile })
				.returning();

			await tx.insert(vectorDatabases).values({ vectorDbId, userId: user.id });

			return { ...user, vectorDbId };
		});
	} catch (error) {
		await deleteTenantDatabase(vectorDbId).catch((cleanupError) =>
			console.error(
				`Failed to clean up tenant database ${vectorDbId}:`,
				cleanupError,
			),
		);
		throw error;
	}
};

export const deleteDocument = async ({
	userId,
	vectorDbId,
	documentId,
}: { userId: number; vectorDbId: string; documentId: string }) => {
	const [document] = await db
		.select()
		.from(documents)
		.where(
			and(eq(documents.documentId, documentId), eq(documents.userId, userId)),
		);

	if (!document) return false;

	await deleteDocumentEmbeddings(vectorDbId, document.documentId);
	await deleteFiles([document.fileName]);
	await db.delete(documents).where(eq(documents.id, document.id));

	return true;
};

export const deleteAccount = async (userId: number) => {
	const [userDocuments, [vectorDatabase]] = await Promise.all([
		db
			.select({ fileName: documents.fileName })
			.from(documents)
			.where(eq(documents.userId, userId)),
		db
			.select({ vectorDbId: vectorDatabases.vectorDbId })
			.from(vectorDatabases)
			.where(eq(vectorDatabases.userId, userId)),
	]);

	await deleteFiles(userDocuments.map((d) => d.fileName));

	if (vectorDatabase) {
		await deleteTenantDatabase(vectorDatabase.vectorDbId);
	}

	await db.delete(users).where(eq(users.id, userId));
};
