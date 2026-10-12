import type { components } from "./api-schema";

type Schemas = components["schemas"];
type CreatedProject =
	components["responses"]["CreatedProject"]["content"]["application/json"];

const NEON_API_URL = "https://console.neon.tech/api/v2";

type NeonResult<T> =
	| { data: T; error: undefined; status: number }
	| { data: undefined; error: unknown; status: number };

// Plain headers on purpose: remix-serve replaces the fetch globals at runtime, and a typed
// client's Request objects lost their Authorization header in production.
const neonFetch = async <T>(
	path: string,
	{ method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<NeonResult<T>> => {
	const response = await fetch(`${NEON_API_URL}${path}`, {
		method,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.NEON_API_KEY}`,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const json = await response.json().catch(() => null);
	return response.ok
		? { data: json as T, error: undefined, status: response.status }
		: { data: undefined, error: json, status: response.status };
};

export const neonApi = {
	createProject: (body: Schemas["ProjectCreateRequest"]) =>
		neonFetch<CreatedProject>("/projects", { method: "POST", body }),

	deleteProject: (projectId: string) =>
		neonFetch<Schemas["ProjectResponse"]>(
			`/projects/${encodeURIComponent(projectId)}`,
			{ method: "DELETE" },
		),

	getConnectionUri: (projectId: string) =>
		neonFetch<Schemas["ConnectionURIResponse"]>(
			`/projects/${encodeURIComponent(projectId)}/connection_uri?${new URLSearchParams(
				{ role_name: "neondb_owner", database_name: "neondb" },
			)}`,
		),
};
