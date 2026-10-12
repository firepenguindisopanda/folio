import { formatDistanceToNowStrict } from "date-fns";

export const timeAgo = (date: string | Date | null) =>
	date ? `${formatDistanceToNowStrict(new Date(date))} ago` : "";

export const timeUntil = (reset: number) => {
	const minutes = Math.max(0, Math.ceil((reset - Date.now()) / 60_000));
	const hours = Math.floor(minutes / 60);
	return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};
