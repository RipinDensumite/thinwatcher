import { useState, useContext, useEffect } from "react";
import { useNavigate, Navigate, useLocation, Link } from "react-router";
import { AuthContext } from "@/context/AuthContext";

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
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
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isBtnLoading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isBtnLoading}
            />
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

        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
