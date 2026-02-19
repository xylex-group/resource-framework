export type DorkQueryPair = [string, string];

export function parseDorkQuery(input: string): DorkQueryPair[] {
	const tokens = String(input || "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	const pairs: DorkQueryPair[] = [];
	for (const tok of tokens) {
		const opMatch = tok.match(/^(.*?)(>=|<=|!=|>|<)(.+)$/);
		if (opMatch) {
			const key = opMatch[1]?.trim();
			const op = opMatch[2];
			const rhs = opMatch[3]?.trim();
			if (key && rhs !== "") {
				pairs.push([key, `${op}${rhs}`]);
				continue;
			}
		}

		const hasColon = tok.includes(":");
		const sep = hasColon ? ":" : "=";
		if (tok.includes(sep)) {
			const [k, ...rest] = tok.split(sep);
			const v = rest.join(sep);
			const key = (k || "").trim();
			const val = (v || "").trim();
			if (key && val !== "") {
				pairs.push([key, val]);
			}
		}
	}
	return pairs;
}

export interface ApplyDorkQueryOptions {
	input: string;
	pathname: string;
	searchParams: URLSearchParams | null;
	preserveParams?: string[];
	onNavigate: (url: string) => void;
}

export function applyDorkQueryToUrl({
	input,
	pathname,
	searchParams,
	preserveParams = ["sortby", "sortdir"],
	onNavigate,
}: ApplyDorkQueryOptions): boolean {
	const pairs = parseDorkQuery(input);
	if (pairs.length === 0) return false;

	const currentEntries = Array.from(searchParams?.entries?.() ?? []) as [
		string,
		string,
	][];
	const current = new URLSearchParams(currentEntries);
	const preserved: Record<string, string> = {};
	preserveParams.forEach((k) => {
		const v = current.get(k);
		if (v != null) preserved[k] = v;
	});

	const next = new URLSearchParams();
	Object.entries(preserved).forEach(([k, v]) => next.set(k, v));
	pairs.forEach(([k, v]) => next.set(k, v));

	try {
		onNavigate(`${pathname}?${next.toString()}`);
		return true;
	} catch {
		return false;
	}
}

