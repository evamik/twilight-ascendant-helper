import React, { useState, useEffect } from "react";

const { ipcRenderer } = window.require ? window.require("electron") : {};

const DataDirectorySettings = () => {
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentPath();
  }, []);

  const loadCurrentPath = async () => {
    if (!ipcRenderer) return;
    try {
      const path = await ipcRenderer.invoke("get-data-path");
      setCurrentPath(path);
    } catch (error) {
      console.error("Error loading data path:", error);
    }
  };

  const handleChooseDirectory = async () => {
    if (!ipcRenderer) return;
    setIsLoading(true);
    try {
      const result = await ipcRenderer.invoke("choose-custom-directory");
      if (result.success) {
        setCurrentPath(result.path);
        alert(
          "Custom directory set successfully! The app will now use this folder."
        );
      }
    } catch (error) {
      console.error("Error choosing directory:", error);
      alert("Failed to set custom directory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!ipcRenderer) return;
    if (
      confirm(
        "Reset to default directory? This will use the standard Warcraft III location."
      )
    ) {
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
    <div>
      <h3 style={{ color: "#ff9800", marginBottom: "15px", fontSize: 18 }}>
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

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={handleChooseDirectory}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ff9800",
            color: "#222",
            border: "none",
            borderRadius: "5px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
            fontWeight: "bold",
            fontSize: "13px",
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
            fontWeight: "bold",
            fontSize: "13px",
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
  );
};

export default DataDirectorySettings;
