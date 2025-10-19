import React, { useState, useEffect } from "react";

const { ipcRenderer } = window.require("electron");

function Settings({ onBack }) {
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentPath();
  }, []);

  const loadCurrentPath = async () => {
    try {
      const path = await ipcRenderer.invoke("get-data-path");
      setCurrentPath(path);
    } catch (error) {
      console.error("Error loading data path:", error);
    }
  };

  const handleChooseDirectory = async () => {
    setIsLoading(true);
    try {
      const result = await ipcRenderer.invoke("choose-custom-directory");
      if (result.success) {
        setCurrentPath(result.path);
        alert("Custom directory set successfully! The app will now use this folder.");
      }
    } catch (error) {
      console.error("Error choosing directory:", error);
      alert("Failed to set custom directory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (confirm("Reset to default directory? This will use the standard Warcraft III location.")) {
      setIsLoading(true);
      try {
        const result = await ipcRenderer.invoke("reset-to-default-directory");
        if (result.success) {
          setCurrentPath(result.path);
          alert("Reset to default directory successfully!");
        }
      } catch (error) {
        console.error("Error resetting directory:", error);
        alert("Failed to reset to default directory");
      } finally {
        setIsLoading(false);
      }
    }
  };

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
        }}
      >
        ← Back
      </button>

      <h2 style={{ color: "white", marginBottom: "20px" }}>Settings</h2>

      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ color: "white", marginBottom: "15px" }}>
          Data Directory
        </h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              color: "#aaa",
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
            }}
          >
            Current Path:
          </label>
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "10px",
              borderRadius: "5px",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "12px",
              wordBreak: "break-all",
            }}
          >
            {currentPath || "Loading..."}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleChooseDirectory}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007acc",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Choose Custom Directory...
          </button>

          <button
            onClick={handleResetToDefault}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Reset to Default
          </button>
        </div>

        <p
          style={{
            color: "#888",
            fontSize: "12px",
            marginTop: "15px",
            lineHeight: "1.5",
          }}
        >
          The data directory should contain your account folders with character
          saves. By default, this is located at:
          <br />
          <code style={{ color: "#aaa" }}>
            Documents\Warcraft III\CustomMapData\Twilight Ascendant
          </code>
        </p>
      </div>
    </div>
  );
}

export default Settings;
