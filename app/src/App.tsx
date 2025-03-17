import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import AgentsPage from "./pages/agents";
import ManageUsersPage from "./pages/users";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster, toast } from "sonner";
import ProfilePage from "./pages/profile";
import BackendCheckerRoute from "./components/BackendCheckerRoute";
import Layout from "./layout/layout";
import { APP_CONFIG } from "./utils/appconfig";
import { TriangleAlert } from "lucide-react";

interface TitleProps {
  title: string;
  children: React.ReactNode;
}

function Title({ title, children }: TitleProps) {
  return (
    <>
      <title>{title}</title>
      {children}
    </>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);

      if (!navigator.onLine) {
        setWasOffline(true);
        toast.loading("No internet connection...", {
          duration: Infinity,
          id: "offline-toast",
        });
      } else if (wasOffline) {
        toast.dismiss("offline-toast");
        toast.success("Internet connection restored!");
      }
    };

    // Listen to the online status
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    // Initial check
    handleStatusChange();

    // Cleanup
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, [isOnline, wasOffline]);

  const ProtectedPageWithLayout = ({
    element,
    requireAdmin = false,
  }: {
    element: React.ReactNode;
    requireAdmin?: boolean;
  }) => (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );

  if (!APP_CONFIG.BACKEND_API_URL || !APP_CONFIG.API_KEY) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-200 p-6">
        <div className="max-w-md w-full">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Configuration Error</h2>
            <p className="text-gray-600 mt-1">Missing critical application settings</p>
          </div>
  
          <div className="flex flex-col gap-3 p-6 rounded-xl bg-white border border-slate-200 shadow-lg">
            {!APP_CONFIG.BACKEND_API_URL && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <TriangleAlert size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Missing Backend API URL</p>
                  <p className="text-sm text-red-600 mt-1">Please set the VITE_BACKEND_API_URL in your environment configuration.</p>
                </div>
              </div>
            )}
            
            {!APP_CONFIG.API_KEY && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <TriangleAlert size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Missing API Key</p>
                  <p className="text-sm text-red-600 mt-1">Please set the VITE_API_KEY in your environment configuration.</p>
                </div>
              </div>
            )}
            
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Check your <code className="bg-blue-100 px-1 py-0.5 rounded">.env</code> file or contact your administrator for assistance.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <AuthProvider>
      <BackendCheckerRoute>
        <Toaster />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <Title title="Login">
                <LoginPage />
              </Title>
            }
          />
          <Route
            path="/register"
            element={
              <Title title="Register">
                <RegisterPage />
              </Title>
            }
          />

          {/* Protected routes with shared layout */}
          <Route
            path="/"
            element={
              <Title title="Watchers">
                <ProtectedPageWithLayout element={<HomePage />} />
              </Title>
            }
          />
          <Route
            path="/agents"
            element={
              <Title title="Agents">
                <ProtectedPageWithLayout element={<AgentsPage />} />
              </Title>
            }
          />
          <Route
            path="/profile"
            element={
              <Title title="Profile">
                <ProtectedPageWithLayout element={<ProfilePage />} />
              </Title>
            }
          />

          {/* Admin routes with shared layout */}
          <Route
            path="/users"
            element={
              <Title title="Users">
                <ProtectedPageWithLayout
                  element={<ManageUsersPage />}
                  requireAdmin={true}
                />
              </Title>
            }
          />

          {/* Catch-all route for 404 */}
          <Route
            path="*"
            element={
              <Title title="404 - Page Not Found">
                <WrongPage />
              </Title>
            }
          />
        </Routes>
      </BackendCheckerRoute>
    </AuthProvider>
  );
}

export default App;
