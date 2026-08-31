import {
	BookOpen,
	Brain,
	HelpCircle,
	Inbox,
	LayoutDashboard,
	Library,
	MessageSquare,
	ScrollText,
	Settings,
	Wrench,
} from "lucide-react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
const pages = [
	{ path: "/", label: "Dashboard", icon: LayoutDashboard },
	{ path: "/libraries", label: "Libraries", icon: Library },
	{ path: "/series", label: "Series", icon: BookOpen },
	{ path: "/books", label: "Reading Lists", icon: Inbox },
	{ path: "/inbox", label: "Inbox", icon: Inbox },
	{ path: "/tools", label: "Tools", icon: Wrench },
	{ path: "/skills", label: "Skills", icon: Brain },
	{ path: "/chat", label: "Chat", icon: MessageSquare },
	{ path: "/settings", label: "Settings", icon: Settings },
	{ path: "/help", label: "Help", icon: HelpCircle },
	{ path: "/logs", label: "Logs", icon: ScrollText },
];
function Dashboard() {
	return (
		<div className="p-6">
			<div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
				<h1 className="text-2xl font-bold">
					kavita-mcp - Dashboard, Libraries, Series, Reading Lists
				</h1>
				<p className="text-slate-400">MOCK mode - configure env to go live</p>
				<a
					data-testid="onboarding-cue"
					href="/onboarding"
					className="mt-4 inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
				>
					Onboard - Connect Kavita
				</a>
				<div className="grid grid-cols-3 gap-4 mt-6">
					<div className="bg-slate-800 p-4 rounded">
						<div className="text-sm text-slate-400">
							Libraries{" "}
							<span className="bg-yellow-500 text-black text-xs px-2 rounded">
								MOCK
							</span>
						</div>
						<div className="text-2xl">2</div>
						<div className="text-xs">Joe Mocky / Sandra Mockinger</div>
					</div>
					<div className="bg-slate-800 p-4 rounded">
						<div>
							Series{" "}
							<span className="bg-yellow-500 text-black text-xs px-2 rounded">
								MOCK
							</span>
						</div>
						<div className="text-2xl">2</div>
					</div>
					<div className="bg-slate-800 p-4 rounded">
						<div>Books</div>
						<div className="text-2xl">2</div>
					</div>
				</div>
			</div>
		</div>
	);
}
function Page({ title }: { title: string }) {
	return (
		<div className="p-6">
			<h2 className="text-xl font-bold" data-testid="page-title">
				{title}
			</h2>
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
						<Route path="/libraries" element={<Page title="Libraries" />} />
						<Route path="/series" element={<Page title="Series" />} />
						<Route path="/books" element={<Page title="Books" />} />
						<Route path="/inbox" element={<Page title="Inbox" />} />
						<Route path="/tools" element={<Page title="Tools" />} />
						<Route path="/skills" element={<Page title="Skills" />} />
						<Route path="/chat" element={<Page title="Chat" />} />
						<Route path="/settings" element={<Page title="Settings" />} />
						<Route path="/help" element={<Page title="Help" />} />
						<Route path="/logs" element={<Page title="Logs" />} />
						<Route path="/onboarding" element={<Page title="Onboarding" />} />
						<Route path="*" element={<Dashboard />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}
