import { create } from "zustand";
import { type ProviderInfo, fetchDiscover, fetchModels } from "../lib/provider";

type LLMStore = {
	provider: string;
	model: string;
	providers: ProviderInfo[];
	models: string[];
	modelsLive: boolean;
	gpu: { present: boolean; name: string | null };
	opportunity: boolean;
	probing: boolean;
	setProvider: (p: string) => void;
	setModel: (m: string) => void;
	refresh: () => Promise<void>;
};

function saved(key: string, fallback: string): string {
	try {
		return localStorage.getItem(key) ?? fallback;
	} catch {
		return fallback;
	}
}

export const useLLM = create<LLMStore>((set, get) => ({
	provider: saved("llm_provider", "ollama"),
	model: saved("llm_model", "llama3.1"),
	providers: [],
	models: [],
	modelsLive: false,
	gpu: { present: false, name: null },
	opportunity: false,
	probing: true,
	setProvider: (p) => {
		try {
			localStorage.setItem("llm_provider", p);
		} catch {
			/* private mode */
		}
		set({ provider: p, models: [] });
		void get()
			.refresh()
			.catch(() => undefined);
	},
	setModel: (m) => {
		try {
			localStorage.setItem("llm_model", m);
		} catch {
			/* private mode */
		}
		set({ model: m });
	},
	refresh: async () => {
		set({ probing: true });
		try {
			const disc = await fetchDiscover();
			const prov = get().provider;
			let models: string[] = [];
			let live = false;
			try {
				const m = await fetchModels(prov);
				models = m.models;
				live = m.live;
			} catch {
				/* keep empty */
			}
			set({
				providers: disc.providers,
				gpu: disc.gpu,
				opportunity: disc.opportunity,
				models,
				modelsLive: live,
				probing: false,
			});
			if (models.length > 0) {
				const cur = saved("llm_model", "");
				if (!models.includes(cur)) {
					const first = models[0];
					try {
						localStorage.setItem("llm_model", first);
					} catch {
						/* ignore */
					}
					set({ model: first });
				}
			}
		} catch {
			set({ probing: false });
		}
	},
}));
