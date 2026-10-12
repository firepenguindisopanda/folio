import { z } from "zod";

export const envSchema = z.object({
	DATABASE_URL: z.string(),
	// Neon
	NEON_API_KEY: z.string(),
	NEON_ORG_ID: z.string().optional(),
	// Auth
	SESSION_SECRET: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GOOGLE_CALLBACK_URL: z.string().url(),
	UPLOADTHING_TOKEN: z.string(),

	// Upstash
	UPSTASH_REDIS_REST_URL: z.string(),
	UPSTASH_REDIS_REST_TOKEN: z.string(),

	NVIDIA_API_KEY: z.string(),
	NVIDIA_CHAT_MODEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
