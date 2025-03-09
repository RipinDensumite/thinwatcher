import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios";

import {
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  Lock,
  KeyRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [canRegister, setCanRegister] = useState(false);
  const { register, error } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

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

  const validateStep = (currentStep: number) => {
    let isValid = true;
    const newErrors = { ...errors };

    if (currentStep === 1) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
        isValid = false;
      } else {
        newErrors.username = "";
      }
    } else if (currentStep === 2) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
        isValid = false;
      } else {
        newErrors.email = "";
      }
    } else if (currentStep === 3) {
      if (!formData.password) {
        newErrors.password = "Password is required";
        isValid = false;
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
        isValid = false;
      } else {
        newErrors.password = "";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      } else {
        newErrors.confirmPassword = "";
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBtnLoading(true);

    if (validateStep(3)) {
      try {
        const response = await register(
          formData.username,
          formData.email,
          formData.password
        );

        console.log("response" + response);

        navigate("/");
      } catch (err) {
        // Error is already set in the context
        console.error("Registration failed:", err);
      }
    }

    setIsBtnLoading(false);
  };

  if (isLoading) {
    return null;
  }

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="mb-5 text-3xl font-bold">ThinWatcher</h1>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Admin Registration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            One-time setup for admin access
          </p>

          <div className="flex justify-between items-center mt-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    step > stepNumber
                      ? "bg-green-100 text-green-600 border-green-600"
                      : step === stepNumber
                      ? "bg-slate-600 text-white border-slate-600"
                      : "bg-gray-100 text-gray-400 border-gray-200"
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    step >= stepNumber
                      ? "text-slate-600 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {stepNumber === 1 && "Username"}
                  {stepNumber === 2 && "Email"}
                  {stepNumber === 3 && "Password"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {(error || errorMessage) && (
            <div role="alert" className="alert alert-error alert-outline mb-4">
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

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    disabled={isBtnLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.username
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={isBtnLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    disabled={isBtnLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <KeyRound className="w-4 h-4" />
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={isBtnLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-ghost"
              disabled={isBtnLoading}
            >
              Back
            </button>
          )}
          {step === 1 && <div></div>}

          {step < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-neutral"
              disabled={isBtnLoading}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-success text-white"
              disabled={isBtnLoading}
            >
              {isBtnLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Complete"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
