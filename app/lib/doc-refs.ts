export type DocRef =
	| { kind: "chapter"; chapter: number }
	| { kind: "section"; chapter: number; section: number };

export type ChapterPosition = "first" | "last" | "next" | "previous";

const NUMBER_WORDS: Record<string, number> = {
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13,
	fourteen: 14,
	fifteen: 15,
	sixteen: 16,
	seventeen: 17,
	eighteen: 18,
	nineteen: 19,
	twenty: 20,
};

const REF_PATTERN = new RegExp(
	`\\b(chapter|chap\\.?|ch\\.?|section|sect\\.?)\\s*(\\d+(?:\\.\\d+)?|${Object.keys(NUMBER_WORDS).join("|")})\\b`,
	"gi",
);

const POSITION_PATTERN =
	/\b(first|last|final|next|following|previous|prior)\s+chapter\b/gi;

const POSITION_ALIASES: Record<string, ChapterPosition> = {
	first: "first",
	last: "last",
	final: "last",
	next: "next",
	following: "next",
	previous: "previous",
	prior: "previous",
};

export const findDocRefs = (
	text: string,
): { refs: DocRef[]; positions: ChapterPosition[] } => {
	const refs = new Map<string, DocRef>();

	for (const [, , raw] of text.matchAll(REF_PATTERN)) {
		const value = raw.toLowerCase();
		const [chapterPart, sectionPart] = (
			NUMBER_WORDS[value] ? String(NUMBER_WORDS[value]) : value
		).split(".");
		const chapter = Number(chapterPart);
		if (!chapter) continue;

		const ref: DocRef = sectionPart
			? { kind: "section", chapter, section: Number(sectionPart) }
			: { kind: "chapter", chapter };
		refs.set(`${chapter}.${sectionPart ?? ""}`, ref);
	}

	const positions = [
		...new Set(
			[...text.matchAll(POSITION_PATTERN)].map(
				([, word]) => POSITION_ALIASES[word.toLowerCase()],
			),
		),
	];

	return { refs: [...refs.values()].slice(0, 2), positions };
};
