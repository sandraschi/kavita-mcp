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
import { useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

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
				<Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
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
			<span data-testid="total-count" className="text-xs text-slate-400">
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
			<span data-testid="page-indicator" className="text-sm text-slate-400">
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
				<span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded">
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
							<div className="text-xs text-slate-400 mt-1">
								{x.type} · {x.count} items
							</div>
							<div className="text-xs text-slate-500">Updated {x.updated}</div>
						</div>
					))}
				</div>
			) : (
				<div
					data-testid="libraries-list"
					className="border border-slate-800 rounded-xl overflow-hidden"
				>
					<table className="w-full text-sm">
						<thead className="bg-slate-900 text-slate-400">
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
				<span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded">
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
							<div className="text-xs text-slate-400">
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
						<thead className="bg-slate-900 text-slate-400">
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
				<span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded">
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
							<div className="text-xs text-slate-400">
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
						<thead className="bg-slate-900 text-slate-400">
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
function Dashboard() {
	return (
		<div className="p-6">
			<div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
				<h1 className="text-2xl font-bold">
					kavita-mcp — Reading & Manga Dashboard
				</h1>
				<p className="text-slate-400">
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
						<div className="text-sm text-slate-400">
							Libraries{" "}
							<span className="bg-yellow-500 text-black text-xs px-2 rounded">
								MOCK
							</span>
						</div>
						<div className="text-2xl">16</div>
					</div>
					<div className="bg-slate-800 p-4 rounded" data-testid="kpi-series">
						<div>
							Series{" "}
							<span className="bg-yellow-500 text-black text-xs px-2 rounded">
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
					<div className="mt-6 text-xs text-slate-500">
						Backend :11189 Frontend :11190
					</div>
				</aside>
				<main className="flex-1">
					<header className="h-12 border-b border-slate-800 flex items-center px-4 justify-between">
						<div>kavita-mcp</div>
						<div
							className="w-3 h-3 bg-green-500 rounded-full"
							data-testid="health-dot"
						/>
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
										className="text-sm text-slate-400 mt-3"
										data-testid="inbox-empty"
									>
										No notifications (mock).
									</div>
								</div>
							}
						/>
						<Route path="/tools" element={<ToolsPage />} />
						<Route
							path="/skills"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Skills
									</h2>
									<div className="text-sm">kavita-expert skill</div>
								</div>
							}
						/>
						<Route
							path="/chat"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Chat
									</h2>
									<div
										className="text-sm text-slate-400"
										data-testid="chat-empty"
									>
										Chat — ask "list libraries"
									</div>
								</div>
							}
						/>
						<Route
							path="/settings"
							element={
								<div className="p-6">
									<h2 className="text-xl font-bold" data-testid="page-title">
										Settings
									</h2>
									<div className="text-sm" data-testid="provider-probe">
										Provider probe
									</div>
								</div>
							}
						/>
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
										className="text-xs font-mono bg-black p-3 rounded"
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
									<p className="text-sm text-slate-400">
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
