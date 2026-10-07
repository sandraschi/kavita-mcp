import { useCallback, useEffect, useState } from "react";

const LEVELS = [0.5, 0.6, 0.7, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0];
const KEY = "tauri-zoom";

function load(): number {
	try {
		const raw = localStorage.getItem(KEY);
		const v = raw ? Number.parseFloat(raw) : 1.0;
		return LEVELS.includes(v) ? v : 1.0;
	} catch {
		return 1.0;
	}
}

/** Fleet zoom: Ctrl+scroll steps levels, Ctrl+0 resets, persisted, CSS-zoom fallback. */
export function useZoom() {
	const [zoom, setZoom] = useState<number>(load);

	useEffect(() => {
		document.documentElement.style.zoom = String(zoom);
		try {
			localStorage.setItem(KEY, String(zoom));
		} catch {
			/* private mode */
		}
	}, [zoom]);

	useEffect(() => {
		const onWheel = (e: WheelEvent) => {
			if (!e.ctrlKey) return;
			e.preventDefault();
			setZoom((z) => {
				const i = LEVELS.indexOf(z);
				const next =
					e.deltaY < 0
						? Math.min(i + 1, LEVELS.length - 1)
						: Math.max(i - 1, 0);
				return LEVELS[next];
			});
		};
		const onKey = (e: KeyboardEvent) => {
			if (!e.ctrlKey) return;
			if (e.key === "0") {
				e.preventDefault();
				setZoom(1.0);
			}
		};
		window.addEventListener("wheel", onWheel, { passive: false });
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("wheel", onWheel);
			window.removeEventListener("keydown", onKey);
		};
	}, []);

	const reset = useCallback(() => setZoom(1.0), []);
	return { zoom, reset, pct: Math.round(zoom * 100) };
}
