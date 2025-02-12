import { Routes, Route } from "react-router";
import HomePage from "./pages/home";
import WrongPage from "./pages/404";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<WrongPage />} />
    </Routes>
  );
}

export default App;
