import { useMediaQuery } from "@uidotdev/usehooks";
import { View, Router } from "lucide-react";
import { useNavigate } from "react-router";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("only screen and (max-width : 768px)");
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <section className="min-h-[100dvh] bg-slate-200/70">
        {/* Top Navigation Bar */}
        <nav className="fixed z-10 top-0 left-0 py-4 w-full flex justify-center bg-slate-100 border-b-1 border-slate-500/30">
          <div className="flex items-center justify-center w-full">
            <h1 className="text-xl font-bold select-none">ThinWatcher</h1>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16 overflow-hidden pb-16">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 w-full bg-slate-100 border-t-1 border-slate-500/30">
          <ul className="flex justify-around items-center p-2">
            <li
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer hover:bg-slate-200 transition-all"
            >
              <View size={20} color="gray" />
              <span className="text-xs">Watchers</span>
            </li>
            <li
              onClick={() => navigate("/agents")}
              className="flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer hover:bg-slate-200 transition-all"
            >
              <Router size={20} color="gray" />
              <span className="text-xs">Agents</span>
            </li>
          </ul>
        </nav>
      </section>
    );
  } else {
    return (
      <section className="min-h-[100dvh]">
        {/* Desktop Sidebar */}
        <nav className="fixed h-full w-60 bg-slate-100 border-r-1 border-slate-500/20 flex flex-col">
          <div className="flex-1">
            <h1 className="p-3 flex items-center justify-center font-bold text-2xl select-none border-b-1 border-slate-500/20 bg-slate-900 text-white">
              ThinWatcher
            </h1>
            <ul className="flex flex-col items-center gap-2 mx-2 mt-3 text-left text-sm">
              <li
                onClick={() => navigate("/")}
                className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer"
              >
                <View size={16} color="gray" />
                Watchers
              </li>
              <li
                onClick={() => navigate("/agents")}
                className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer"
              >
                <Router size={16} color="gray" />
                Agents
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="w-full min-h-[100dvh] pl-60 bg-slate-50 overflow-auto">
          {children}
        </main>
      </section>
    );
  }
}