import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";
// import LoginPage from "./pages/login";
import AgentsPage from "./pages/agents";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agents" element={<AgentsPage />} />
      {/* <Route path="/" element={<LoginPage />} /> */}
      <Route path="*" element={<WrongPage />} />
    </Routes>
  );
}

export default App;
