import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { loadSiteTexts } from "./lib/siteTexts";

// Ask Sanity for the site's texts right away, in parallel with the first render
loadSiteTexts();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
