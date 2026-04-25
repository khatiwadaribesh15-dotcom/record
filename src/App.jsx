import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ClockBar from "./components/ClockBar";
import Dashboard from "./pages/Dashboard";
import GameRecord from "./pages/GameRecord";
import Shifts from "./pages/Shifts";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Dashboard />} />
        <Route path="/game"   element={<GameRecord />} />
        <Route path="/shifts" element={<Shifts />} />
      </Routes>
      <ClockBar />
    </BrowserRouter>
  );
}