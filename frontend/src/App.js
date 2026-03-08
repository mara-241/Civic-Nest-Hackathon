import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const ResidentPortal = lazy(() => import("./pages/resident/ResidentPortal"));
const WorkerPortal = lazy(() => import("./pages/worker/WorkerPortal"));
const AdminPortal = lazy(() => import("./pages/admin/AdminPortal"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-slate-600">Loading…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/resident/*" element={<ResidentPortal />} />
          <Route path="/worker/*" element={<WorkerPortal />} />
          <Route path="/admin/*" element={<AdminPortal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
