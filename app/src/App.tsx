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

  if (!import.meta.env.VITE_BACKEND_API_URL) {
    return <h1>Missing backend api url</h1>;
  }

  if (!import.meta.env.VITE_API_KEY) {
    return <h1>Missing backend api key</h1>;
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
