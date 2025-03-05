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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {(error || errorMessage) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            {/* <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isBtnLoading}
            /> */}
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

          <div className="mb-6">
            {/* <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isBtnLoading}
            /> */}
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
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
