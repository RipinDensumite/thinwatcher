import { useNavigate } from "react-router";

export default function LoginPage() {
  const navigate = useNavigate();
  
  return (
    <section className="flex min-h-[100dvh] items-center justify-center bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-gray-400 via-gray-600 to-blue-800">
      <div className="w-full max-w-md p-8 mx-4 bg-white rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            ThinWatcher
          </h1>
          <p className="text-slate-500 text-sm">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
              placeholder="Enter your password"
            />
          </div>

          <div className="pt-2">
            <button onClick={() => navigate("/home")} className="w-full py-3 px-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 active:shadow-md">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
