import { generateText } from "ai";
import { chatModel, thinkingOptions } from "./ai.server";

const OPENING_CHARS = 12_000;
const SAMPLE_COUNT = 8;
const SAMPLE_CHARS = 1_000;

const sampleText = (text: string) => {
	const opening = text.slice(0, OPENING_CHARS);
	const rest = text.slice(OPENING_CHARS);
	if (rest.length <= SAMPLE_CHARS * SAMPLE_COUNT) return opening + rest;

	const step = Math.floor(rest.length / SAMPLE_COUNT);
	const samples = Array.from({ length: SAMPLE_COUNT }, (_, i) =>
		rest.slice(i * step, i * step + SAMPLE_CHARS),
	);
	return [opening, ...samples].join("\n\n[...]\n\n");
};

export const generateDocumentOverview = async (title: string, text: string) => {
	try {
		const { text: overview } = await generateText({
			model: chatModel,
			providerOptions: thinkingOptions(false),
			temperature: 0.2,
			maxTokens: 600,
			prompt: `Below are the opening pages of a document titled "${title}", followed by short samples from later in it.

Write an overview of the whole document in at most 200 words:
- what kind of document it is and who it is for
- its main purpose or central idea
- the main parts, chapters or topics it covers

Use only what the text supports. Write plain prose with a short bulleted list of the main topics. Don't start with "This document" every sentence and don't add a heading.

---
${sampleText(text)}`,
		});
		return overview.trim() || null;
	} catch (error) {
		console.error("Document overview generation failed:", error);
		return null;
	}
};
