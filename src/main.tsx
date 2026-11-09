import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { loadSiteTexts } from "./lib/siteTexts";
import { initBotId } from "botid/client/core";

// Ask Sanity for the site's texts right away, in parallel with the first render
loadSiteTexts();

// Vercel BotID: an invisible check the contact form's sends carry, verified in /api/contact
initBotId({ protect: [{ path: "/api/contact", method: "POST" }] });

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
