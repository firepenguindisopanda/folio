import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Embeddings } from "@langchain/core/embeddings";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const CHAT_MODEL =
	process.env.NVIDIA_CHAT_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";

const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";
export const EMBEDDING_DIMENSIONS = 1024;
const EMBEDDING_BATCH_SIZE = 50;

const nvidia = createOpenAICompatible({
	name: "nvidia",
	baseURL: NVIDIA_BASE_URL,
	apiKey: process.env.NVIDIA_API_KEY,
});

export const chatModel = nvidia.chatModel(CHAT_MODEL);

export const thinkingOptions = (enabled: boolean) => ({
	nvidia: { chat_template_kwargs: { enable_thinking: enabled } },
});

class NvidiaEmbeddings extends Embeddings {
	constructor() {
		super({ maxRetries: 3 });
	}

	private async embed(input: string[], inputType: "query" | "passage") {
		const res = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
			},
			body: JSON.stringify({
				model: EMBEDDING_MODEL,
				input,
				input_type: inputType,
				dimensions: EMBEDDING_DIMENSIONS,
				encoding_format: "float",
				truncate: "END",
			}),
		});

		if (!res.ok) {
			throw new Error(
				`NVIDIA embeddings request failed (${res.status}): ${await res.text()}`,
			);
		}

		const { data }: { data: { index: number; embedding: number[] }[] } =
			await res.json();

		return data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
	}

	async embedDocuments(texts: string[]) {
		const vectors: number[][] = [];
		for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
			const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
			vectors.push(
				...(await this.caller.call(() => this.embed(batch, "passage"))),
			);
		}
		return vectors;
	}

	async embedQuery(text: string) {
		const [vector] = await this.caller.call(() => this.embed([text], "query"));
		return vector;
	}
}

export const createEmbeddings = () => new NvidiaEmbeddings();
