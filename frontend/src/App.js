import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import ResidentPortal from "./pages/resident/ResidentPortal";
import WorkerPortal from "./pages/worker/WorkerPortal";
import AdminPortal from "./pages/admin/AdminPortal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/resident/*" element={<ResidentPortal />} />
        <Route path="/worker/*" element={<WorkerPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
