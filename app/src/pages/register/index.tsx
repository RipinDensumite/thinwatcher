import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios"; // Ensure you have axios installed

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

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
        if (response.data.canRegister === false) {
          navigate("/login");
        }
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

    // Additional check for registration permission
    if (!canRegister) {
      setErrorMessage("Registration is currently not allowed");
      return;
    }

    setIsBtnLoading(true);
    setErrorMessage("");

    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required");
      setIsBtnLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsBtnLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setIsBtnLoading(false);
      return;
    }

    try {
      const response = await register(username, email, password);

      // Check if this is the first user (admin)
      if (response.isFirstUser) {
        // Optionally, show a special message for first admin user
        alert("You are the first user and have been granted admin privileges!");
      }

      navigate("/"); // Redirect to home page after successful registration
    } catch (err) {
      // Error is already set in the context
      console.error("Registration failed:", err);
      setIsBtnLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // If registration is not allowed, show a message
  if (!canRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6">Registration Closed</h1>
          <p className="text-gray-600">
            Registration is currently not available. An administrator account
            already exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Create First Admin Account
        </h1>

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

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isBtnLoading}
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Create Admin Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
