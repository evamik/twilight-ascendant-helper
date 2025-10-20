import React from "react";
import DataDirectorySettings from "./DataDirectorySettings";
import LoaderSettings from "./LoaderSettings";

function Settings({ onBack }) {
  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={onBack}
        style={{
          position: "sticky",
          top: "10px",
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#444",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1,
          fontWeight: "bold",
        }}
      >
        ← Back
      </button>

      <h2 style={{ color: "white", marginBottom: "20px", fontSize: 22 }}>
        Settings
      </h2>

      {/* Data Directory Settings Section */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <DataDirectorySettings />
      </div>

      {/* Loader Settings Section */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <LoaderSettings />
      </div>
    </div>
  );
}

export default Settings;
