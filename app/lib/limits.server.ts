import { Ratelimit } from "@upstash/ratelimit";
import { DAILY_MESSAGE_LIMIT, MESSAGES_PER_MINUTE } from "./constants";
import { redis } from "./redis.server";
import type { DailyUsage } from "./usage";

export const minuteLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(MESSAGES_PER_MINUTE, "60 s"),
	prefix: "ratelimit:minute",
	analytics: true,
});

const dailyChatLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(DAILY_MESSAGE_LIMIT, "1 d"),
	prefix: "ratelimit:daily-chat",
});

export const consumeDailyMessage = async (
	userId: number,
): Promise<DailyUsage & { success: boolean }> => {
	const { success, remaining, reset } = await dailyChatLimiter.limit(
		String(userId),
	);
	return {
		success,
		used: DAILY_MESSAGE_LIMIT - remaining,
		remaining,
		limit: DAILY_MESSAGE_LIMIT,
		reset,
	};
};

export const getDailyUsage = async (userId: number): Promise<DailyUsage> => {
	const { remaining, reset } = await dailyChatLimiter.getRemaining(
		String(userId),
	);
	return {
		used: DAILY_MESSAGE_LIMIT - remaining,
		remaining,
		limit: DAILY_MESSAGE_LIMIT,
		reset,
	};
};
