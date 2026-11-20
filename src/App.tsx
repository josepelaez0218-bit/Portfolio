import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import NebrijaAudit from "./pages/reports/NebrijaAudit.tsx";
import { caseOpen } from "./components/ProjectsGallery.tsx";

// Only the open case pages render (see PUBLIC_CASES); the rest go home
const Case = () => {
  const { slug = "" } = useParams();
  return caseOpen(slug) ? <ProjectDetail /> : <Navigate to="/" replace />;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/work/:slug" element={<Case />} />
      {/* The Lab is being reworked: off the site for now */}
      <Route path="/lab" element={<Navigate to="/" replace />} />
      {/* Reports for one reader: unlisted, noindex (see vercel.json) */}
      <Route path="/informes/nebrija" element={<NebrijaAudit />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
