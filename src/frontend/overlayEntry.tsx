import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/variables.css";
import Overlay from "./Overlay";

const OverlayEntry: React.FC = () => <Overlay visible={true} />;

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<OverlayEntry />);
}
