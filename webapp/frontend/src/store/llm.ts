import { create } from "zustand";
export const useLLM = create(() => ({ provider: "ollama", model: "llama3" }));
