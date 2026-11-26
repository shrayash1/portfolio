import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/motion"; // sets the "still" class before the first paint
import "./home.css";
import { Home } from "./Home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
