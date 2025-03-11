import { useContext, useState, useEffect } from "react";
import Layout from "@/layout/layout";
import { User, Mail, Lock, KeyRound } from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

function ProfilePage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { token, user } = useContext(AuthContext);

  // Set placeholders based on current user info
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: "",
        email: "",
      }));
    }
  }, [user]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    const hasChanges =
      formData.username || formData.email || formData.newPassword;

    // Username validation - only if provided
    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else {
      newErrors.username = "";
    }

    // Email validation - only if provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    } else {
      newErrors.email = "";
    }

    // Current password validation - only required if there are changes
    if (hasChanges && !formData.currentPassword) {
      newErrors.currentPassword =
        "Current password is required to make changes";
      isValid = false;
    } else {
      newErrors.currentPassword = "";
    }

    // New password validation - only if provided
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
      isValid = false;
    } else {
      newErrors.newPassword = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const hasChanges =
      formData.username || formData.email || formData.newPassword;

    // If no changes, show a message
    if (!hasChanges) {
      setErrorMessage("No changes to update");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Only send fields that have values
      const dataToSend = {
        currentPassword: formData.currentPassword,
        ...(formData.username && { username: formData.username }),
        ...(formData.email && { email: formData.email }),
        ...(formData.newPassword && { newPassword: formData.newPassword }),
      };

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccessMessage(
        "Profile updated successfully! Please refresh the page"
      );

      // Clear form fields after successful update
      setFormData({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    formData.username || formData.email || formData.newPassword ? true : false;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-slate-100 mt-2">
              Update your personal information and password
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {errorMessage}
              </div>
            )}

            {/* Current User Information */}
            {user && (
              <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-700 mb-3">
                  Current Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm text-slate-500 mr-2">
                      Username:
                    </span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm text-slate-500 mr-2">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information Section */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Update Profile Information
                  </h2>
                  <div className="h-px bg-gray-200 mb-6"></div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    New Username (Optional)
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={user?.username || "Enter new username"}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.username
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-slate-200 focus:border-slate-500"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Mail className="w-4 h-4" />
                    New Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={user?.email || "Enter new email"}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-slate-200 focus:border-slate-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Section */}
                <div className="md:col-span-2 mt-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Change Password
                  </h2>
                  <div className="h-px bg-gray-200 mb-6"></div>
                </div>

                {/* Current Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="currentPassword"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Lock className="w-4 h-4" />
                    Current Password {"(Required)"}
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.currentPassword
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-slate-200 focus:border-slate-500"
                    }`}
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <KeyRound className="w-4 h-4" />
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.newPassword
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-slate-200 focus:border-slate-500"
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.newPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    formData.currentPassword === "" ||
                    hasChanges === false
                  }
                  className={`${
                    isSubmitting ||
                    formData.currentPassword === "" ||
                    hasChanges === false
                      ? ""
                      : "cursor-pointer"
                  } w-full md:w-auto px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-70`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
