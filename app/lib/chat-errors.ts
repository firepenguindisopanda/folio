export type ChatErrorCode =
	| "UNAUTHORIZED"
	| "BAD_REQUEST"
	| "RATE_LIMIT"
	| "DAILY_LIMIT"
	| "NOT_FOUND";

export type ChatError = {
	error: string;
	code?: ChatErrorCode;
	reset?: number;
	limit?: number;
};

export const parseChatError = (error: Error | undefined): ChatError | null => {
	if (!error) return null;
	try {
		const parsed = JSON.parse(error.message);
		if (parsed && typeof parsed.error === "string") return parsed;
	} catch {}
	return { error: error.message || "Something went wrong. Please try again." };
};
