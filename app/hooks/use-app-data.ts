import { useRouteLoaderData } from "@remix-run/react";
import type { loader } from "~/routes/_app";

export const useAppData = () => {
	const data = useRouteLoaderData<typeof loader>("routes/_app");
	if (!data) throw new Error("useAppData must be used inside the app layout");
	return data;
};
