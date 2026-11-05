import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import { CASES_OPEN } from "./components/ProjectsGallery.tsx";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      {/* Case pages closed for now (see CASES_OPEN): their links go home */}
      <Route path="/work/:slug" element={CASES_OPEN ? <ProjectDetail /> : <Navigate to="/" replace />} />
      {/* The Lab is being reworked: off the site for now */}
      <Route path="/lab" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
