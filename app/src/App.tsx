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

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);

      if (!navigator.onLine) {
        toast.loading("No internet connection...", {
          duration: Infinity,
          id: "offline-toast",
        });
      } else {
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
  }, [isOnline]);

  return (
    <AuthProvider>
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
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <Title title="Watchers">
                <HomePage />
              </Title>
            }
          />
          <Route
            path="/agents"
            element={
              <Title title="Agents">
                <AgentsPage />
              </Title>
            }
          />
          <Route
            path="/profile"
            element={
              <Title title="Profile">
                <ProfilePage />
              </Title>
            }
          />
        </Route>
        Admin routes
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route
            path="/users"
            element={
              <Title title="Users">
                <ManageUsersPage />
              </Title>
            }
          />
        </Route>
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
    </AuthProvider>
  );
}

export default App;
