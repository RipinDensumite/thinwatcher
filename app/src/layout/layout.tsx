import { useMediaQuery } from "@uidotdev/usehooks";
import {
  View,
  Router,
  LogOut,
  Menu,
  User,
  CircleUserRound,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { AuthContext } from "@/context/AuthContext";
import { useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("only screen and (max-width : 768px)");
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (isMobile) {
    return (
      <section className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Top Navigation Bar */}
        <nav className="fixed z-10 top-0 left-0 py-3 w-full bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 w-full">
            <h1 className="select-none text-xl font-bold bg-gradient-to-r from-slate-600 to-stone-600 bg-clip-text text-transparent">
              ThinWatcher
            </h1>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors duration-200"
            >
              <Menu size={22} className="text-slate-700" />
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute top-full left-0 w-full bg-white shadow-md rounded-b-lg z-20 overflow-hidden"
                initial={{ height: 0, y: -10 }}
                animate={{ height: "auto", y: 0 }}
                exit={{ height: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  ease: [0.04, 0.62, 0.23, 0.98],
                }}
              >
                <motion.div
                  className="p-3 border-b border-slate-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <motion.div
                    className="flex items-center gap-3 px-2 py-2"
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.04, 0.62, 0.23, 0.98],
                    }}
                  >
                    <motion.div
                      className="bg-gradient-to-r from-slate-500 to-stone-500 rounded-full p-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CircleUserRound size={32} className="text-white" />
                    </motion.div>
                    <div>
                      <motion.p
                        className="font-medium text-slate-900"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {user?.username}
                      </motion.p>
                      <motion.p
                        className="text-xs text-slate-500"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {user?.role}
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
                <motion.ul
                  className="py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <a
                      onClick={() => {
                        navigate("/profile");
                        setIsOpen(false);
                      }}
                      className="cursor-pointer flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={18} className="text-slate-500" />
                      <span>Profile</span>
                    </a>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <a
                      onClick={handleLogout}
                      className="cursor-pointer flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </a>
                  </motion.li>
                </motion.ul>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="pt-14 pb-16 px-4">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-xl">
          <ul className="flex justify-around items-center py-2">
            <motion.li
              animate={{ y: isActive("/") ? -5 : 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => navigate("/")}
              className={`select-none flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive("/")
                  ? "text-slate-600 bg-slate-50"
                  : "cursor-pointer text-slate-500 hover:bg-slate-50"
              }`}
            >
              <View
                size={20}
                className={isActive("/") ? "text-slate-600" : ""}
              />
              <span className="select-none text-xs font-medium">Watchers</span>
            </motion.li>
            <motion.li
              animate={{ y: isActive("/agents") ? -5 : 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => navigate("/agents")}
              className={`select-none flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive("/agents")
                  ? "text-slate-600 bg-slate-50"
                  : "cursor-pointer text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Router
                size={20}
                className={isActive("/agents") ? "text-slate-600" : ""}
              />
              <span className="select-none text-xs font-medium">Agents</span>
            </motion.li>
            {user?.role === "admin" && (
              <motion.li
                animate={{ y: isActive("/users") ? -5 : 0 }}
                transition={{ duration: 0.1 }}
                onClick={() => navigate("/users")}
                className={`select-none flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  isActive("/users")
                    ? "text-slate-600 bg-slate-50"
                    : "cursor-pointer text-slate-500 hover:bg-slate-50"
                }`}
              >
                <User
                  size={20}
                  className={isActive("/users") ? "text-slate-600" : ""}
                />
                <span className="select-none text-xs font-medium">Users</span>
              </motion.li>
            )}
          </ul>
        </nav>
      </section>
    );
  } else {
    return (
      <section className="min-h-[100dvh] flex bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Desktop Sidebar */}
        <nav className="fixed h-full w-64 bg-white shadow-md flex flex-col">
          <div className="p-5 flex items-center justify-center">
            <h1 className="select-none font-bold text-2xl bg-gradient-to-r from-slate-600 to-stone-600 bg-clip-text text-transparent">
              ThinWatcher
            </h1>
          </div>

          <div className="flex-1 px-3 py-6">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => navigate("/")}
                  className={`w-full px-4 py-3 rounded-lg transition-all ${
                    isActive("/")
                      ? "bg-gradient-to-r from-slate-100 to-stone-100/80 text-slate-600 font-medium"
                      : "cursor-pointer text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <motion.div
                    animate={{ x: isActive("/") ? 5 : 0 }}
                    className="flex items-center gap-3"
                  >
                    <View
                      size={18}
                      className={
                        isActive("/") ? "text-slate-600" : "text-slate-500"
                      }
                    />
                    <span>Watchers</span>
                  </motion.div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/agents")}
                  className={`w-full px-4 py-3 rounded-lg transition-all ${
                    isActive("/agents")
                      ? "bg-gradient-to-r from-slate-100 to-stone-100/80 text-slate-600 font-medium"
                      : "cursor-pointer text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <motion.div
                    animate={{ x: isActive("/agents") ? 5 : 0 }}
                    className="flex items-center gap-3"
                  >
                    <Router
                      size={18}
                      className={
                        isActive("/agents")
                          ? "text-slate-600"
                          : "text-slate-500"
                      }
                    />
                    <span>Agents</span>
                  </motion.div>
                </button>
              </li>
              {user?.role === "admin" && (
                <li>
                  <button
                    onClick={() => navigate("/users")}
                    className={`w-full px-4 py-3 rounded-lg transition-all ${
                      isActive("/users")
                        ? "bg-gradient-to-r from-slate-100 to-stone-100/80 text-slate-600 font-medium"
                        : "cursor-pointer text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <motion.div
                      animate={{ x: isActive("/users") ? 5 : 0 }}
                      className="flex items-center gap-3"
                    >
                      <User
                        size={18}
                        className={
                          isActive("/users")
                            ? "text-slate-600"
                            : "text-slate-500"
                        }
                      />
                      <span>Users</span>
                    </motion.div>
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="border-t border-slate-100 p-3">
            <div className="relative">
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
              >
                <div className="bg-gradient-to-r from-slate-500 to-stone-500 rounded-full p-1">
                  <CircleUserRound size={28} className="text-white" />
                </div>
                <div className="select-none flex-1">
                  <p className="font-medium text-slate-900 truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2, type: "tween" }}
                >
                  <ChevronLeft size={20} className="text-slate-900" />
                </motion.div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    className="absolute bottom-full left-0 w-full bg-white rounded-lg mb-2 overflow-hidden"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.ul className="py-1">
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ x: 5 }}
                      >
                        <a
                          onClick={() => {
                            navigate("/profile");
                            setIsOpen(false);
                          }}
                          className="cursor-pointer flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
                        >
                          <Settings size={16} className="text-slate-500" />
                          <span className="select-none">Profile</span>
                        </a>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ x: 5 }}
                      >
                        <a
                          onClick={handleLogout}
                          className="cursor-pointer flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                        >
                          <LogOut size={16} />
                          <span className="select-none">Logout</span>
                        </a>
                      </motion.li>
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 pl-64 min-h-[100dvh] overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </section>
    );
  }
}
