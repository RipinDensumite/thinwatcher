import { useMediaQuery } from "@uidotdev/usehooks";
import { ChevronRight, View, Router, Settings } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("only screen and (max-width : 768px)");

  if (isMobile) {
    return (
      <section className="min-h-[100dvh] bg-slate-200/70">
        {/* <nav className="fixed z-10 top-0 left-0 py-4 rounded-md bg-white/30 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-60 w-full flex justify-center border-b-2 border-slate-300/50">
          <div className="flex items-center justify-center w-full">
            <h1 className="text-xl font-bold select-none">ThinWatcher</h1>
          </div>
        </nav> */}
        <nav className="fixed z-10 top-0 left-0 py-4 w-full flex justify-center bg-slate-100 border-b-1 border-slate-500/30">
          <div className="flex items-center justify-center w-full">
            <h1 className="text-xl font-bold select-none">ThinWatcher</h1>
          </div>
        </nav>
        <main className="pt-16 overflow-hidden">{children}</main>
      </section>
    );
  } else {
    return (
      <section className="min-h-[100dvh]">
        <nav className="fixed h-full w-60 bg-slate-100 border-r-1 border-slate-500/20 flex flex-col">
          <div className="flex-1">
            <h1 className=" p-3 flex items-center justify-center font-bold text-2xl select-none border-b-1 border-slate-500/20 bg-slate-900 text-white">
              ThinWatcher
            </h1>
            <ul className="flex flex-col items-center gap-2 mx-2 mt-3 text-left text-sm">
              <li className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer">
                <View size={16} color="gray" />
                Watchers
              </li>
              <li className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer">
                <Router size={16} color="gray" />
                Agents
              </li>
              <li className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer">
                <Settings size={16} color="gray" />
                Settings
              </li>
            </ul>
          </div>
          <span className="hover:bg-slate-200 transition-all mx-2 mb-2 p-2 rounded-md cursor-pointer text-center flex items-center justify-between gap-3">
            <div className=" flex items-center gap-3">
              <img
                className="size-6 rounded-md"
                src="https://ui.shadcn.com/avatars/shadcn.jpg"
                alt=""
              />
              <span className="text-sm font-semibold">Admin</span>
            </div>
            <ChevronRight size={16} />
          </span>
        </nav>
        <main className="w-full min-h-[100dvh] pl-60 bg-slate-50 overflow-auto">
          {children}
        </main>
      </section>
    );
  }
}
