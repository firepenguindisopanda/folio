import { redis } from "./redis.server";

const key = (fileKey: string) => `upload:${fileKey}`;
const PENDING_UPLOAD_TTL_SECONDS = 60 * 60;

export const recordUpload = (fileKey: string, userId: number) =>
	redis.set(key(fileKey), userId, { ex: PENDING_UPLOAD_TTL_SECONDS });

export const isUploadOwnedBy = async (fileKey: string, userId: number) =>
	String(await redis.get(key(fileKey))) === String(userId);

export const clearUpload = (fileKey: string) => redis.del(key(fileKey));
