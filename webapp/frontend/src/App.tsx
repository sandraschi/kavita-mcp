import {
	BookOpen,
	Bookmark,
	Brain,
	ChevronLeft,
	ChevronRight,
	Grid3X3,
	HelpCircle,
	Inbox,
	LayoutDashboard,
	Library,
	List,
	MessageSquare,
	ScrollText,
	Search,
	Settings,
	SlidersHorizontal,
	Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { useZoom } from "./hooks/useZoom";
import {
	type ChatMessage,
	fetchModels,
	fetchOnboarding,
	fetchSkills,
	postChat,
} from "./lib/provider";
import { useLLM } from "./store/llm";

const pages = [
	{ path: "/", label: "Dashboard", icon: LayoutDashboard },
	{ path: "/libraries", label: "Libraries", icon: Library },
	{ path: "/series", label: "Series", icon: BookOpen },
	{ path: "/reading", label: "Reading Lists", icon: Bookmark },
	{ path: "/inbox", label: "Inbox", icon: Inbox },
	{ path: "/tools", label: "Tools", icon: Wrench },
	{ path: "/skills", label: "Skills", icon: Brain },
	{ path: "/chat", label: "Chat", icon: MessageSquare },
	{ path: "/settings", label: "Settings", icon: Settings },
	{ path: "/help", label: "Help", icon: HelpCircle },
	{ path: "/logs", label: "Logs", icon: ScrollText },
];

const MOCK_LIBS = Array.from({ length: 16 }, (_, i) => ({
	id: i + 1,
	name:
		[
			"Joe Mocky Manga",
			"Sandra Mockinger Ebooks",
			"Goliath Light Novels",
			"Seinen Mock",
			"Manhwa Mock",
			"Kavita+ Curated",
		][i % 6] + ` #${i + 1}`,
	type: ["Manga", "Book", "LightNovel"][i % 3],
	count: 8 + i * 2,
	updated: `2026-08-${String(10 + (i % 20)).padStart(2, "0")}`,
}));
const MOCK_SERIES = Array.from({ length: 26 }, (_, i) => ({
	id: i + 1,
	name:
		[
			"Mock Berserk",
			"Sandra Mockinger Saga",
			"One Piece Mock",
			"Dune Mock",
			"Sandman Mock",
			"Witcher Mock",
		][i % 6] + ` ${i + 1}`,
	library: MOCK_LIBS[i % MOCK_LIBS.length].name,
	volumes: 1 + (i % 5),
	chapters: 5 + (i % 20),
	progress: Math.round(Math.random() * 100),
}));
const MOCK_LISTS = Array.from({ length: 14 }, (_, i) => ({
	id: i + 1,
	title:
		["Weekly Reads", "Joe Mocky Picks", "Sandra Favorites", "Kavita+ Recs"][
			i % 4
		] + ` ${i + 1}`,
	items: 3 + (i % 7),
	owner: ["Joe Mocky", "Sandra Mockinger"][i % 2],
}));

function usePaged<T>(items: T[], pageSize = 12) {
	const [page, setPage] = useState(1);
	const [q, setQ] = useState("");
	const [sort, setSort] = useState("name");
	const [view, setView] = useState<"grid" | "list">("grid");
	const filtered = useMemo(() => {
		let f = items.filter((x) =>
			JSON.stringify(x).toLowerCase().includes(q.toLowerCase()),
		);
		f = [...f].sort((a: any, b: any) => {
			if (sort === "name")
				return (a.name || a.title || "").localeCompare(b.name || b.title || "");
			if (sort === "count")
				return (b.count || b.chapters || 0) - (a.count || a.chapters || 0);
			if (sort === "newest")
				return (b.updated || b.id).localeCompare(a.updated || a.id);
			return 0;
		});
		return f;
	}, [items, q, sort]);
	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const cur = Math.min(page, totalPages);
	const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);
	return {
		q,
		setQ,
		sort,
		setSort,
		view,
		setView,
		page: cur,
		setPage,
		total,
		totalPages,
		slice,
	};
}
function Toolbar({
	q,
	setQ,
	sort,
	setSort,
	view,
	setView,
	total,
}: {
	q: string;
	setQ: any;
	sort: string;
	setSort: any;
	view: string;
	setView: any;
	total: number;
}) {
	return (
		<div className="flex flex-wrap gap-3 items-center mb-4">
			<div className="relative flex-1 min-w-[220px]">
				<Search size={16} className="absolute left-3 top-2.5 text-slate-300" />
				<input
					data-testid="filter-input"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Filter..."
					className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
				/>
			</div>
			<select
				data-testid="sort-select"
				value={sort}
				onChange={(e) => setSort(e.target.value)}
				className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
			>
				<option value="name">Sort: Name</option>
				<option value="count">Sort: Count</option>
				<option value="newest">Sort: Newest</option>
			</select>
			<div className="flex border border-slate-700 rounded-lg overflow-hidden">
				<button
					data-testid="view-grid"
					onClick={() => setView("grid")}
					className={`px-3 py-2 ${view === "grid" ? "bg-cyan-600" : "bg-slate-800"}`}
				>
					<Grid3X3 size={14} />
				</button>
				<button
					data-testid="view-list"
					onClick={() => setView("list")}
					className={`px-3 py-2 ${view === "list" ? "bg-cyan-600" : "bg-slate-800"}`}
				>
					<List size={14} />
				</button>
			</div>
			<span data-testid="total-count" className="text-sm text-slate-300">
				{total} items
			</span>
		</div>
	);
}
function Pagination({
	page,
	setPage,
	totalPages,
}: { page: number; setPage: any; totalPages: number }) {
	return (
		<div className="flex items-center justify-between mt-4">
			<button
				data-testid="prev-page"
				disabled={page <= 1}
				onClick={() => setPage((p: number) => Math.max(1, p - 1))}
				className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-30 flex gap-1 items-center"
			>
				<ChevronLeft size={14} /> Prev
			</button>
			<span data-testid="page-indicator" className="text-sm text-slate-300">
				Page {page} / {totalPages}
			</span>
			<button
				data-testid="next-page"
				disabled={page >= totalPages}
				onClick={() => setPage((p: number) => p + 1)}
				className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded disabled:opacity-30 flex gap-1 items-center"
			>
				Next <ChevronRight size={14} />
			</button>
		</div>
	);
}
function LibrariesPage() {
	const p = usePaged(MOCK_LIBS, 12);
	return (
		<div className="p-6">
			<h2
				className="text-xl font-bold mb-4 flex gap-2 items-center"
				data-testid="page-title"
			>
				Libraries{" "}
				<span className="bg-yellow-500 text-black text-sm px-2 py-0.5 rounded">
					MOCK
				</span>
			</h2>
			<Toolbar
				q={p.q}
				setQ={p.setQ}
				sort={p.sort}
				setSort={p.setSort}
				view={p.view}
				setView={p.setView}
				total={p.total}
			/>
			{p.view === "grid" ? (
				<div
					data-testid="libraries-grid"
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					{p.slice.map((x) => (
						<div
							key={x.id}
							data-testid="library-card"
							className="bg-slate-900 border border-slate-800 rounded-xl p-4"
						>
							<div className="font-semibold text-sm">{x.name}</div>
							<div className="text-sm text-slate-300 mt-1">
								{x.type} · {x.count} items
							</div>
							<div className="text-sm text-slate-300">Updated {x.updated}</div>
						</div>
					))}
				</div>
			) : (
				<div
					data-testid="libraries-list"
					className="border border-slate-800 rounded-xl overflow-hidden"
				>
					<table className="w-full text-sm">
						<thead className="bg-slate-900 text-slate-300">
							<tr>
								<th className="text-left p-3">Name</th>
								<th className="text-left p-3">Type</th>
								<th className="text-right p-3">Items</th>
							</tr>
						</thead>
						<tbody>
							{p.slice.map((x) => (
								<tr
									key={x.id}
									data-testid="library-row"
									className="border-t border-slate-800"
								>
									<td className="p-3">{x.name}</td>
									<td className="p-3">{x.type}</td>
									<td className="p-3 text-right">{x.count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Pagination page={p.page} setPage={p.setPage} totalPages={p.totalPages} />
		</div>
	);
}
function SeriesPage() {
	const p = usePaged(MOCK_SERIES, 12);
	return (
		<div className="p-6">
			<h2
				className="text-xl font-bold mb-4 flex gap-2 items-center"
				data-testid="page-title"
			>
				Series{" "}
				<span className="bg-yellow-500 text-black text-sm px-2 py-0.5 rounded">
					MOCK
				</span>
			</h2>
			<Toolbar
				q={p.q}
				setQ={p.setQ}
				sort={p.sort}
				setSort={p.setSort}
				view={p.view}
				setView={p.setView}
				total={p.total}
			/>
			{p.view === "grid" ? (
				<div
					data-testid="series-grid"
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					{p.slice.map((x) => (
						<div
							key={x.id}
							data-testid="series-card"
							className="bg-slate-900 border border-slate-800 rounded-xl p-4"
						>
							<div className="font-semibold text-sm">{x.name}</div>
							<div className="text-sm text-slate-300">
								{x.library} · {x.volumes} vols · {x.chapters} ch
							</div>
							<div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
								<div
									className="h-full bg-cyan-600"
									style={{ width: `${x.progress}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			) : (
				<div
					data-testid="series-list"
					className="border border-slate-800 rounded-xl overflow-hidden"
				>
					<table className="w-full text-sm">
						<thead className="bg-slate-900 text-slate-300">
							<tr>
								<th className="text-left p-3">Series</th>
								<th className="text-left p-3">Library</th>
								<th className="text-right p-3">Progress</th>
							</tr>
						</thead>
						<tbody>
							{p.slice.map((x) => (
								<tr
									key={x.id}
									data-testid="series-row"
									className="border-t border-slate-800"
								>
									<td className="p-3">{x.name}</td>
									<td className="p-3">{x.library}</td>
									<td className="p-3 text-right">{x.progress}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Pagination page={p.page} setPage={p.setPage} totalPages={p.totalPages} />
		</div>
	);
}
function ReadingListsPage() {
	const p = usePaged(MOCK_LISTS, 12);
	return (
		<div className="p-6">
			<h2
				className="text-xl font-bold mb-4 flex gap-2 items-center"
				data-testid="page-title"
			>
				Reading Lists{" "}
				<span className="bg-yellow-500 text-black text-sm px-2 py-0.5 rounded">
					MOCK
				</span>
			</h2>
			<Toolbar
				q={p.q}
				setQ={p.setQ}
				sort={p.sort}
				setSort={p.setSort}
				view={p.view}
				setView={p.setView}
				total={p.total}
			/>
			{p.view === "grid" ? (
				<div
					data-testid="lists-grid"
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					{p.slice.map((x) => (
						<div
							key={x.id}
							data-testid="list-card"
							className="bg-slate-900 border border-slate-800 rounded-xl p-4"
						>
							<div className="font-semibold text-sm">{x.title}</div>
							<div className="text-sm text-slate-300">
								{x.items} items · by {x.owner}
							</div>
						</div>
					))}
				</div>
			) : (
				<div
					data-testid="lists-list"
					className="border border-slate-800 rounded-xl overflow-hidden"
				>
					<table className="w-full text-sm">
						<thead className="bg-slate-900 text-slate-300">
							<tr>
								<th className="text-left p-3">Title</th>
								<th className="text-left p-3">Owner</th>
								<th className="text-right p-3">Items</th>
							</tr>
						</thead>
						<tbody>
							{p.slice.map((x) => (
								<tr
									key={x.id}
									data-testid="list-row"
									className="border-t border-slate-800"
								>
									<td className="p-3">{x.title}</td>
									<td className="p-3">{x.owner}</td>
									<td className="p-3 text-right">{x.items}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Pagination page={p.page} setPage={p.setPage} totalPages={p.totalPages} />
		</div>
	);
}
function useBackendStatus(): "up" | "down" | "probing" {
	const [state, setState] = useState<"up" | "down" | "probing">("probing");
	useEffect(() => {
		let cancelled = false;
		let timer = 0;
		void (async () => {
			try {
				const mod = await import("@tauri-apps/api/event");
				if (!cancelled) {
					await mod.listen<string>("backend-status", (e) => {
						if (!cancelled) setState(e.payload === "ready" ? "up" : "down");
					});
				}
			} catch {
				/* dev browser: HTTP poll only */
			}
		})();
		const delays = [1000, 2000, 4000, 8000, 16000];
		let i = 0;
		const poll = async () => {
			try {
				const r = await fetch("/api/health");
				if (!cancelled && r.ok) {
					setState("up");
					i = 0;
				}
			} catch {
				if (!cancelled) setState((s) => (s === "up" ? "down" : s));
			}
			if (!cancelled) {
				timer = window.setTimeout(
					() => void poll(),
					delays[Math.min(i++, delays.length - 1)],
				);
			}
		};
		void poll();
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, []);
	return state;
}
function ToolsPage() {
	return (
		<div className="p-6">
			<h2 className="text-xl font-bold" data-testid="page-title">
				Tools
			</h2>
			<div className="mt-4 grid gap-3">
				<div
					data-testid="tool-card"
					className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-sm"
				>
					kavita_library (list, get, scan)
				</div>
				<div
					data-testid="tool-card"
					className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-sm"
				>
					kavita_series (list, search, get, get_chapters)
				</div>
				<div
					data-testid="tool-card"
					className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-sm"
				>
					kavita_reading (get_progress, mark_progress, get_bookmarks)
				</div>
				<div
					data-testid="tool-card"
					className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-sm"
				>
					show_kavita_status_prefab (app=True)
				</div>
			</div>
		</div>
	);
}
const PERSONALITIES = [
	{
		id: "librarian",
		label: "Librarian",
		system:
			"You are a precise Kavita librarian. Answer briefly, name library/series ids when known.",
	},
	{
		id: "critic",
		label: "Manga Critic",
		system:
			"You are a sharp manga critic. Recommend reads from the user's libraries, no spoilers.",
	},
	{
		id: "coach",
		label: "Reading Coach",
		system:
			"You are a reading coach. Track progress, suggest next volumes, celebrate streaks.",
	},
	{
		id: "opds",
		label: "OPDS Nerd",
		system:
			"You are an OPDS/feed nerd. Explain feeds, readers, and sync options concretely.",
	},
	{ id: "custom", label: "Custom", system: "" },
];
const EXAMPLE_PROMPTS = [
	"List my libraries",
	"Search for Berserk",
	"What am I currently reading?",
	"Show progress for series 1",
	"Mark volume 2 as 75% read",
	"Is the bridge live or MOCK?",
	"Which LLM providers are detected?",
];
const CHAT_KEY = "kavita-chat-v1";
type Msg = ChatMessage & { id: number };

function ChatPage() {
	const { provider, model, providers, probing, refresh } = useLLM();
	const idRef = useRef(0);
	const [messages, setMessages] = useState<Msg[]>(() => {
		try {
			const raw = localStorage.getItem(CHAT_KEY);
			const arr = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
			return (Array.isArray(arr) ? arr.slice(-100) : []).map((m) => ({
				...m,
				id: ++idRef.current,
			}));
		} catch {
			return [];
		}
	});
	const [input, setInput] = useState("");
	const [persona, setPersona] = useState("librarian");
	const [customSystem, setCustomSystem] = useState("");
	const [skillPre, setSkillPre] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState("");
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		void refresh().catch(() => undefined);
		void fetchSkills()
			.then((s) => setSkillPre(s.join("\n")))
			.catch(() => undefined);
	}, [refresh]);
	useEffect(() => {
		try {
			localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-100)));
		} catch {
			/* private mode */
		}
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const detected = providers.some((p) => p.detected);
	const status = probing ? "yellow" : detected ? "green" : "red";

	const send = async (text: string) => {
		const content = text.trim();
		if (!content || sending) return;
		setSending(true);
		setError("");
		const personaSys =
			persona === "custom"
				? customSystem || "You are a helpful assistant."
				: (PERSONALITIES.find((p) => p.id === persona)?.system ?? "");
		const sys: ChatMessage[] = [
			{
				role: "system",
				content:
					`${personaSys}\n\nSkill context (kavita-expert):\n${skillPre}`.trim(),
			},
		];
		const next: Msg[] = [
			...messages,
			{ role: "user" as const, content, id: ++idRef.current },
		].slice(-100);
		setMessages(next);
		setInput("");
		const assistantId = ++idRef.current;
		try {
			let acc = "";
			const reply = await postChat(provider, model, [...sys, ...next], (d) => {
				acc += d;
				const snapshot = acc;
				setMessages((m) => {
					const base = m[m.length - 1]?.id === assistantId ? m.slice(0, -1) : m;
					return [
						...base,
						{ role: "assistant" as const, content: snapshot, id: assistantId },
					].slice(-100);
				});
			});
			setMessages((m) => {
				const base = m[m.length - 1]?.id === assistantId ? m.slice(0, -1) : m;
				return [
					...base,
					{
						role: "assistant" as const,
						content: reply || acc,
						id: assistantId,
					},
				].slice(-100);
			});
		} catch (e) {
			setError(
				e instanceof Error
					? e.message
					: "chat failed — see Settings / onboarding",
			);
		} finally {
			setSending(false);
		}
	};

	const exportTxt = () => {
		const blob = new Blob(
			[messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")],
			{ type: "text/plain" },
		);
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "kavita-chat.txt";
		a.click();
		URL.revokeObjectURL(a.href);
	};

	return (
		<div className="p-6" data-testid="chat-page">
			<h2 className="text-xl font-bold" data-testid="page-title">
				Chat
			</h2>
			<div
				data-testid="chat-controls"
				className="mt-3 flex flex-wrap gap-3 items-center bg-slate-900 border border-slate-800 rounded-xl p-3"
			>
				<select
					data-testid="personality-select"
					value={persona}
					onChange={(e) => setPersona(e.target.value)}
					className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
				>
					{PERSONALITIES.map((p) => (
						<option key={p.id} value={p.id}>
							{p.label}
						</option>
					))}
				</select>
				{persona === "custom" && (
					<input
						value={customSystem}
						onChange={(e) => setCustomSystem(e.target.value)}
						placeholder="Custom system prompt..."
						className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
					/>
				)}
				<span
					data-testid="provider-status"
					className={`text-sm ${status === "green" ? "text-emerald-300" : status === "yellow" ? "text-amber-300" : "text-red-300"}`}
				>
					● {provider}/{model || "no-model"}
				</span>
			</div>
			<div data-testid="example-prompts" className="mt-3 flex flex-wrap gap-2">
				{EXAMPLE_PROMPTS.map((ex) => (
					<button
						key={ex}
						onClick={() => void send(ex)}
						disabled={sending}
						className="text-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 disabled:opacity-40"
					>
						{ex}
					</button>
				))}
			</div>
			<div
				data-testid="chat-messages"
				className="mt-3 space-y-2 min-h-[200px] max-h-[50vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-4"
			>
				{messages.length === 0 && (
					<div data-testid="chat-empty" className="text-sm text-slate-300">
						Ask about your libraries — try "list my libraries" or pick an
						example above.
					</div>
				)}
				{messages.map((m) => (
					<div
						key={m.id}
						className={`text-sm p-2 rounded-lg ${m.role === "user" ? "bg-cyan-950 ml-8" : m.role === "system" ? "hidden" : "bg-slate-800 mr-8"}`}
					>
						<span className="text-slate-300 font-semibold">{m.role}: </span>
						<span className="whitespace-pre-wrap">{m.content}</span>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
			{error && <div className="mt-2 text-sm text-red-300">{error}</div>}
			<div className="mt-3 flex gap-2">
				<input
					data-testid="chat-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") void send(input);
					}}
					placeholder="Ask about your manga library..."
					className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
				/>
				<button
					data-testid="chat-send"
					onClick={() => void send(input)}
					disabled={sending || !input.trim()}
					className="px-4 py-2 bg-cyan-600 rounded-lg text-sm font-bold disabled:opacity-40"
				>
					Send
				</button>
				<button
					data-testid="chat-export"
					onClick={exportTxt}
					disabled={messages.length === 0}
					className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40"
				>
					Export
				</button>
				<button
					data-testid="chat-clear"
					onClick={() => {
						setMessages([]);
						try {
							localStorage.removeItem(CHAT_KEY);
						} catch {
							/* ignore */
						}
					}}
					disabled={messages.length === 0}
					className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-40"
				>
					Clear
				</button>
			</div>
		</div>
	);
}
function SettingsPage() {
	const {
		provider,
		model,
		providers,
		models,
		modelsLive,
		gpu,
		opportunity,
		probing,
		setProvider,
		setModel,
		refresh,
	} = useLLM();
	const [testing, setTesting] = useState<string | null>(null);
	const [testResult, setTestResult] = useState("");
	const [advice, setAdvice] = useState("");

	useEffect(() => {
		void refresh().catch(() => undefined);
		void fetchOnboarding()
			.then((o) => setAdvice(o.recommended))
			.catch(() => undefined);
	}, [refresh]);

	const testProvider = async (id: string) => {
		setTesting(id);
		setTestResult("");
		try {
			const m = await fetchModels(id);
			setTestResult(
				`${id}: ${m.live ? "LIVE" : "fallback"} — ${m.models.length} models`,
			);
		} catch (e) {
			setTestResult(
				`${id}: FAILED (${e instanceof Error ? e.message : "unreachable"})`,
			);
		} finally {
			setTesting(null);
		}
	};

	const anyDetected = providers.some((p) => p.detected);

	return (
		<div className="p-6">
			<h2 className="text-xl font-bold" data-testid="page-title">
				Settings
			</h2>
			<div data-testid="provider-probe" className="mt-3 text-sm text-slate-300">
				{probing
					? "Probing local providers..."
					: anyDetected
						? "Local LLM ready."
						: "No local LLM detected."}
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-2">
				{providers.map((p) => (
					<div
						key={p.id}
						data-testid={`llm-provider-card-${p.id}`}
						className={`bg-slate-900 border rounded-xl p-4 ${provider === p.id ? "border-cyan-600" : "border-slate-800"}`}
					>
						<div className="flex items-center justify-between">
							<div className="font-semibold text-sm">{p.label}</div>
							<span
								className={`text-sm ${p.detected ? "text-emerald-300" : "text-slate-300"}`}
							>
								● {p.detected ? "detected" : "not found"}
							</span>
						</div>
						<div className="mt-3 flex gap-2">
							<button
								onClick={() => setProvider(p.id)}
								className="text-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg"
							>
								Use
							</button>
							<button
								data-testid={`llm-test-${p.id}`}
								onClick={() => void testProvider(p.id)}
								disabled={testing === p.id}
								className="text-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg disabled:opacity-40"
							>
								{testing === p.id ? "Testing..." : "Test"}
							</button>
						</div>
					</div>
				))}
			</div>
			<div className="mt-4 flex flex-wrap gap-3 items-center">
				<label className="text-sm text-slate-300" htmlFor="llm-provider-select">
					Provider
				</label>
				<select
					id="llm-provider-select"
					data-testid="llm-provider-select"
					value={provider}
					onChange={(e) => setProvider(e.target.value)}
					className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
				>
					{providers.map((p) => (
						<option key={p.id} value={p.id}>
							{p.label}
						</option>
					))}
				</select>
				<label className="text-sm text-slate-300" htmlFor="llm-model-select">
					Model
				</label>
				<select
					id="llm-model-select"
					data-testid="llm-model-select"
					value={model}
					onChange={(e) => setModel(e.target.value)}
					className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
				>
					{models.length === 0 && <option value="">no models detected</option>}
					{models.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</select>
				<span className="text-sm text-slate-300">
					{modelsLive ? "live list" : "fallback list"}
				</span>
			</div>
			{testResult && (
				<div className="mt-3 text-sm text-slate-300">{testResult}</div>
			)}
			<div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm">
				<div className="font-semibold">GPU</div>
				<div className="text-slate-300 mt-1">
					{gpu.present ? `Detected: ${gpu.name}` : "No NVIDIA GPU detected."}
					{opportunity &&
						" GPU is present but no LLM is running — install Ollama to use it."}
				</div>
			</div>
			{!anyDetected && !probing && (
				<div
					data-testid="llm-onboarding"
					className="mt-4 bg-red-950 border border-red-800 rounded-xl p-4 text-sm"
				>
					No LLM provider detected. Install Ollama (free, local) then pick it
					above. {advice}
				</div>
			)}
		</div>
	);
}
function SkillsPage() {
	const [skills, setSkills] = useState<
		{ name: string; description: string }[] | null
	>(null);
	const [err, setErr] = useState("");
	useEffect(() => {
		void (async () => {
			try {
				const r = await fetch("/api/skills");
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				const data = (await r.json()) as {
					skills: { name: string; description: string }[];
				};
				setSkills(data.skills);
			} catch (e) {
				setErr(e instanceof Error ? e.message : "failed");
			}
		})();
	}, []);
	return (
		<div className="p-6">
			<h2 className="text-xl font-bold" data-testid="page-title">
				Skills
			</h2>
			{skills === null && !err && (
				<div className="text-sm text-slate-300 mt-3">Loading skills...</div>
			)}
			{err && (
				<div className="text-sm text-red-300 mt-3">
					Failed to load skills: {err}{" "}
					<button
						onClick={() => window.location.reload()}
						className="underline"
					>
						Retry
					</button>
				</div>
			)}
			{skills !== null && skills.length === 0 && (
				<div className="text-sm text-slate-300 mt-3">
					No skills registered yet.{" "}
					<span className="text-slate-300">
						Add one under src/kavita_mcp/skills/.
					</span>
				</div>
			)}
			<div className="mt-3 grid gap-3">
				{(skills ?? []).map((s) => (
					<div
						key={s.name}
						data-testid="skill-card"
						className="bg-slate-900 border border-slate-800 rounded-xl p-4"
					>
						<div className="font-mono text-sm text-cyan-300">
							skill://kavita-mcp/{s.name}
						</div>
						<div className="text-sm text-slate-300 mt-1">{s.description}</div>
					</div>
				))}
			</div>
		</div>
	);
}
function Dashboard() {
	return (
		<div className="p-6">
			<div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
				<h1 className="text-2xl font-bold">
					kavita-mcp — Reading & Manga Dashboard
				</h1>
				<p className="text-slate-300">
					MOCK mode — configure KAVITA_URL to go live · Kareadita/Kavita v0.9.1
					Kavita+ overhaul
				</p>
				<a
					data-testid="onboarding-cue"
					href="/onboarding"
					className="mt-4 inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
				>
					Onboard — Connect Kavita
				</a>
				<div className="grid grid-cols-3 gap-4 mt-6">
					<div className="bg-slate-800 p-4 rounded" data-testid="kpi-libraries">
						<div className="text-sm text-slate-300">
							Libraries{" "}
							<span className="bg-yellow-500 text-black text-sm px-2 rounded">
								MOCK
							</span>
						</div>
						<div className="text-2xl">16</div>
					</div>
					<div className="bg-slate-800 p-4 rounded" data-testid="kpi-series">
						<div>
							Series{" "}
							<span className="bg-yellow-500 text-black text-sm px-2 rounded">
								MOCK
							</span>
						</div>
						<div className="text-2xl">26</div>
					</div>
					<div className="bg-slate-800 p-4 rounded" data-testid="kpi-lists">
						<div>Reading Lists</div>
						<div className="text-2xl">14</div>
					</div>
				</div>
			</div>
		</div>
	);
}
export default function App() {
	const backend = useBackendStatus();
	const { pct } = useZoom();
	const dot =
		backend === "up"
			? "bg-green-500"
			: backend === "down"
				? "bg-red-500"
				: "bg-amber-400";
	return (
		<BrowserRouter>
			<div className="flex min-h-screen bg-slate-950">
				<aside className="w-64 border-r border-slate-800 p-4">
					<div className="font-bold text-cyan-400">kavita-mcp</div>
					<nav className="mt-4 space-y-1">
						{pages.map((p) => (
							<Link
								key={p.path}
								to={p.path}
								data-testid={`nav-${p.label.toLowerCase()}`}
								className="flex gap-2 p-2 hover:bg-slate-800 rounded"
							>
								<p.icon size={16} />
								{p.label}
							</Link>
						))}
					</nav>
					<div className="mt-6 text-sm text-slate-300">
						Backend :11189 Frontend :11190
					</div>
				</aside>
				<main className="flex-1">
					<header className="h-12 border-b border-slate-800 flex items-center px-4 justify-between">
						<div>kavita-mcp</div>
						<div className="flex items-center gap-3">
							<span
								data-testid="zoom-indicator"
								className="text-sm text-slate-300"
							>
								{pct}%
							</span>
							<div
								className={`w-3 h-3 ${dot} rounded-full`}
								data-testid="backend-dot"
								data-state={backend}
								title={`backend: ${backend}`}
							/>
						</div>
					</header>
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/libraries" element={<LibrariesPage />} />
						<Route path="/series" element={<SeriesPage />} />
						<Route path="/reading" element={<ReadingListsPage />} />
						<Route
							path="/inbox"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Inbox
									</h2>
									<div
										className="text-sm text-slate-300 mt-3"
										data-testid="inbox-empty"
									>
										No notifications (mock).
									</div>
								</div>
							}
						/>
						<Route path="/tools" element={<ToolsPage />} />
						<Route path="/skills" element={<SkillsPage />} />
						<Route path="/chat" element={<ChatPage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route
							path="/help"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Help
									</h2>
									<p className="text-sm">
										Ports 11189/11190 · Kareadita/Kavita v0.9.1
									</p>
								</div>
							}
						/>
						<Route
							path="/logs"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Logs
									</h2>
									<div
										className="text-sm font-mono bg-black p-3 rounded"
										data-testid="logs-view"
									>
										mock logs
									</div>
								</div>
							}
						/>
						<Route
							path="/onboarding"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Onboarding
									</h2>
									<p className="text-sm text-slate-300">
										See docs/ONBOARDING.md
									</p>
								</div>
							}
						/>
						<Route path="*" element={<Dashboard />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}
