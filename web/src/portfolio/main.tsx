import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/motion"; // sets the "still" class before the first paint
import "./portfolio.css";
import { Portfolio } from "./Portfolio";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Portfolio />
  </StrictMode>,
);
