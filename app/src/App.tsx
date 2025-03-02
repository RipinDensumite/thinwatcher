import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";
// import LoginPage from "./pages/login";
import AgentsPage from "./pages/agents";

function Title({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <title>{title}</title>
      {children}
    </>
  );
}

function App() {
  return (
    <Routes>
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
      {/* <Route path="/" element={<LoginPage />} /> */}
      <Route
        path="*"
        element={
          <Title title="404 - Page Not Found">
            <WrongPage />
          </Title>
        }
      />
    </Routes>
  );
}

export default App;
