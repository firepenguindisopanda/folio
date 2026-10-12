import { createCookie } from "@remix-run/node";

export type Theme = "system" | "light" | "dark";

const themeCookie = createCookie("theme", {
	path: "/",
	sameSite: "lax",
	httpOnly: true,
	maxAge: 60 * 60 * 24 * 365,
});

export const isTheme = (value: unknown): value is Theme =>
	value === "system" || value === "light" || value === "dark";

export const getTheme = async (request: Request): Promise<Theme> => {
	const value = await themeCookie.parse(request.headers.get("Cookie"));
	return isTheme(value) ? value : "system";
};

export const serializeTheme = (theme: Theme) => themeCookie.serialize(theme);
