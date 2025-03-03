import { useMediaQuery } from "@uidotdev/usehooks";
import { View, Router, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("only screen and (max-width : 768px)");
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isMobile) {
    return (
      <section className="min-h-[100dvh] bg-slate-200/70">
        {/* Top Navigation Bar */}
        <nav className="fixed z-10 top-0 left-0 py-4 w-full flex justify-center bg-slate-100 border-b-1 border-slate-500/30">
          <div className="flex items-center justify-center w-full relative">
            <h1 className="text-xl font-bold select-none">ThinWatcher</h1>
            <div className="dropdown dropdown-end absolute right-5">
              <div tabIndex={0} role="button" className="btn btn-ghost m-1">
                <Menu size={20} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
              >
                <li>
                  <button onClick={handleLogout} className="btn">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
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
          <div>
            <ul>
              <li className="flex flex-row items-center justify-between gap-2 p-2 select-none">
                <div className="flex flex-row items-center gap-2">
                  <div className="avatar">
                    <div className="w-11 rounded-full">
                      <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                    </div>
                  </div>
                  <span>{user?.username}</span>
                </div>
                <LogOut
                  onClick={handleLogout}
                  size={16}
                  className="cursor-pointer mr-2"
                />
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
