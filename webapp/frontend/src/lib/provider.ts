export type ProviderInfo = {
	id: string;
	label: string;
	url: string;
	detected: boolean;
};

export type DiscoverState = {
	providers: ProviderInfo[];
	gpu: { present: boolean; name: string | null };
	opportunity: boolean;
};

async function getJSON<T>(path: string): Promise<T> {
	const r = await fetch(path);
	if (!r.ok) throw new Error(`${path} -> ${r.status}`);
	return (await r.json()) as T;
}

export async function fetchDiscover(): Promise<DiscoverState> {
	return getJSON<DiscoverState>("/api/llm/discover");
}

export async function fetchProviders(): Promise<DiscoverState> {
	return getJSON<DiscoverState>("/api/llm/providers");
}

export async function fetchModels(
	provider: string,
): Promise<{ provider: string; models: string[]; live: boolean }> {
	return getJSON(`/api/llm/models?provider=${encodeURIComponent(provider)}`);
}

export async function fetchSkills(): Promise<string[]> {
	try {
		const data = await getJSON<{
			skills: { name: string; description: string }[];
		}>("/api/skills");
		return data.skills.map((s) => `${s.name}: ${s.description}`);
	} catch {
		return [];
	}
}

export async function fetchOnboarding(): Promise<{ recommended: string }> {
	return getJSON("/api/llm/onboarding");
}

export type ChatMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};

/** POST to the SSE stream; falls back to blocking JSON when streaming fails. */
export async function postChat(
	provider: string,
	model: string,
	messages: ChatMessage[],
	onDelta?: (piece: string) => void,
	signal?: AbortSignal,
): Promise<string> {
	try {
		const r = await fetch("/api/llm/chat/stream", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, model, messages }),
			signal,
		});
		if (!r.ok || !r.body) throw new Error(`stream -> ${r.status}`);
		const reader = r.body.getReader();
		const decoder = new TextDecoder();
		let reply = "";
		let buf = "";
		let gotDelta = false;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			buf += decoder.decode(value, { stream: true });
			const parts = buf.split("\n\n");
			buf = parts.pop() ?? "";
			for (const part of parts) {
				const line = part.trim();
				if (!line.startsWith("data:")) continue;
				const payload = line.slice(5).trim();
				if (payload === "[DONE]") continue;
				try {
					const obj = JSON.parse(payload) as { delta?: string; error?: string };
					if (obj.error) throw new Error(obj.error);
					if (obj.delta) {
						gotDelta = true;
						reply += obj.delta;
						onDelta?.(obj.delta);
					}
				} catch (e) {
					if (e instanceof Error && !e.message.startsWith("{")) throw e;
				}
			}
		}
		if (!gotDelta) throw new Error("empty stream");
		return reply;
	} catch (e) {
		if (signal?.aborted) throw e;
		const r = await fetch("/api/llm/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, model, messages }),
			signal,
		});
		const data = (await r.json()) as { reply?: string; error?: string };
		if (!r.ok || !data.reply)
			throw new Error(data.error ?? `chat -> ${r.status}`);
		return data.reply;
	}
}

export async function probe(): Promise<{ ok: boolean }> {
	try {
		const r = await fetch("/api/health");
		return { ok: r.ok };
	} catch {
		return { ok: false };
	}
}
