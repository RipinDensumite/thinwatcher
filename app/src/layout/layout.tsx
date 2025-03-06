import { useMediaQuery } from "@uidotdev/usehooks";
import {
  View,
  Router,
  LogOut,
  Menu,
  User,
  CircleUserRound,
} from "lucide-react";
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
                  <a onClick={handleLogout}>
                    <LogOut
                      onClick={handleLogout}
                      size={16}
                      className="cursor-pointer text-red-600"
                    />
                    <span className="text-red-600">Logout</span>
                  </a>
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
            {user?.role === "admin" && (
              <li
                onClick={() => navigate("/users")}
                className="flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer hover:bg-slate-200 transition-all"
              >
                <User size={20} color="gray" />
                <span className="text-xs">Users</span>
              </li>
            )}
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
              {user?.role === "admin" && (
                <li
                  onClick={() => navigate("/users")}
                  className="hover:bg-slate-200 flex items-center gap-2 transition-all w-full py-2 pl-2 rounded-md cursor-pointer"
                >
                  <User size={16} color="gray" />
                  Users
                </li>
              )}
            </ul>
          </div>
          <div>
            <ul>
              <div className="dropdown dropdown-top dropdown-center w-full">
                <li
                  tabIndex={0}
                  role="button"
                  className="flex flex-row items-center justify-between gap-2 select-none hover:bg-slate-200 transition-all rounded-md cursor-pointer mx-2 mb-2 px-1 py-1"
                >
                  <div className="flex flex-row items-center gap-2">
                    <div className="avatar">
                      <div className="w-8">
                        <CircleUserRound
                          size={32}
                          color="black"
                          strokeWidth={1.2}
                        />
                      </div>
                    </div>
                    <span className="font-bold">{user?.username}</span>
                  </div>
                </li>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                  <li>
                    <a onClick={handleLogout}>
                      <LogOut
                        onClick={handleLogout}
                        size={16}
                        className="cursor-pointer text-red-600"
                      />
                      <span className="text-red-600">Logout</span>
                    </a>{" "}
                  </li>
                  <li>
                    <a onClick={() => navigate("/profile")}>Profile</a>
                  </li>
                </ul>
              </div>
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
