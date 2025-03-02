import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import AgentsPage from "./pages/agents";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
  return (
    <AuthProvider>
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
        </Route>

        {/* Admin routes
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route
            path="/admin"
            element={
              <Title title="Admin Dashboard">
                <AdminPage />
              </Title>
            }
          />
        </Route> */}

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