import { useState, useContext, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios";

interface LocationState {
  from?: {
    pathname: string;
  };
}

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);
  const { login, error, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;

  // Get the previous location or default to home page
  const from = locationState?.from?.pathname || "/";

  useEffect(() => {
    // Short timeout to ensure auth state is properly loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if registration is allowed
    const checkRegistrationStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/can-register`);
        setCanRegister(response.data.canRegister);
      } catch (err) {
        console.error("Error checking registration status", err);
        setErrorMessage("Unable to check registration status");
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBtnLoading(true);
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      setIsBtnLoading(false);
      return;
    }

    try {
      await login(username, password);
      // Redirect to the page they were trying to access or home page
      navigate(from, { replace: true });
    } catch (err) {
      // Error is already set in the context
      console.error("Login failed:", err);
      setIsBtnLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (canRegister) {
    return <Navigate to="/register" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="min-h-[100dvh] flex flex-row ">
      {/* Left Side */}
      <div className="relative flex-1 hidden md:block">
        <div className="absolute inset-0 m-2 rounded-lg overflow-hidden">
          <h1 className="absolute left-5 top-5 z-10 text-white text-2xl font-bold">
            ThinWatcher
          </h1>
          <img
            src="https://cdn.pixabay.com/photo/2021/07/15/08/43/abstract-6467846_1280.png"
            alt="Login visual"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
          <h2 className="mb-2 text-2xl font-bold">Welcome Back</h2>
          <p className="max-w-md text-sm text-white/80">
            Log in to your account to access your dashboard, manage your
            profile, and continue your journey with us.
          </p>
        </div>
      </div>
      {/* Right Side */}
      <main className="flex-1 flex items-center justify-center">
        <div className="m-5 px-5 mx-auto max-w-md">
          <h1 className="mx-auto w-fit mb-10 text-3xl font-bold">
            ThinWatcher
          </h1>
          <div className="mb-3 flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="text-md">
              Enter your email and password to access your account
            </p>
          </div>

          {(error || errorMessage) && (
            <div role="alert" className="alert alert-error alert-outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-1">
              <legend className="fieldset-legend">Username</legend>
              <label className="input validator w-full">
                <svg
                  className="h-[1em] opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </g>
                </svg>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isBtnLoading}
                />
              </label>
            </div>

            <div className="mb-5">
              <legend className="fieldset-legend">Password</legend>
              <label className="input validator w-full">
                <svg
                  className="h-[1em] opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                    <circle
                      cx="16.5"
                      cy="7.5"
                      r=".5"
                      fill="currentColor"
                    ></circle>
                  </g>
                </svg>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBtnLoading}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn w-full bg-slate-900 text-white"
              disabled={isBtnLoading}
            >
              {isBtnLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="text-center mt-3 text-sm">
              Don't have an account? request account from admin
            </p>
          </form>
        </div>
      </main>
    </section>
  );
};

export default LoginPage;
