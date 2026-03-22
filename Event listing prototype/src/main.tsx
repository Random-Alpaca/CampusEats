
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "@fontsource-variable/figtree";
  import "@fontsource-variable/fraunces";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  