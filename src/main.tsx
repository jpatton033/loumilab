import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/urbanist/500.css";
import "@fontsource/urbanist/600.css";
import "@fontsource/urbanist/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
