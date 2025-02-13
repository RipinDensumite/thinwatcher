import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";
import LoginPage from "./pages/login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<WrongPage />} />
    </Routes>
  );
}

export default App;
