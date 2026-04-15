import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import GameRecord from "./pages/GameRecord";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"     element={<Dashboard />} />
        <Route path="/game" element={<GameRecord />} />
      </Routes>
    </BrowserRouter>
  );
}