import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { Database, Upload, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { IngestPage } from "@/pages/IngestPage";
import { RAGPage } from "@/pages/RAGPage";

const NAV = [
  { to: "/", label: "Collections", icon: Database },
  { to: "/ingest", label: "Ingest", icon: Upload },
  { to: "/rag", label: "RAG", icon: MessageSquare },
];

function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-muted/20 min-h-screen p-4 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-4">
        RAG Web Demo
      </p>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl">
          <Routes>
            <Route path="/" element={<CollectionsPage />} />
            <Route path="/ingest" element={<IngestPage />} />
            <Route path="/rag" element={<RAGPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
