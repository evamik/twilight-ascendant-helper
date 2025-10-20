import React, { useState, useEffect } from "react";

const { ipcRenderer } = window.require ? window.require("electron") : {};

const LoaderSettings = () => {
  const [preloadText, setPreloadText] = useState("");
  const [postloadText, setPostloadText] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  // Load current settings on mount
  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.invoke("get-loader-settings").then((settings) => {
        setPreloadText((settings.preloadMessages || []).join("\n"));
        setPostloadText((settings.postloadMessages || []).join("\n"));
      });
    }
  }, []);

  const handleSavePreload = async () => {
    if (!ipcRenderer) return;

    // Split by newlines and filter out empty lines
    const messages = preloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = await ipcRenderer.invoke("set-preload-messages", messages);
    if (result.success) {
      setSaveStatus("Preload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleSavePostload = async () => {
    if (!ipcRenderer) return;

    // Split by newlines and filter out empty lines
    const messages = postloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = await ipcRenderer.invoke("set-postload-messages", messages);
    if (result.success) {
      setSaveStatus("Postload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: 18, color: "#ff9800" }}>
        Loader Settings
      </h3>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 14,
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          Preload Messages
        </label>
        <div
          style={{
            fontSize: 12,
            color: "#aaa",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          Messages sent <strong>before</strong> the load command. One message
          per line. Each message will be sent with Enter before and after.
        </div>
        <textarea
          value={preloadText}
          onChange={(e) => setPreloadText(e.target.value)}
          placeholder="Enter messages (one per line)&#10;Example:&#10;Loading character...&#10;Please wait"
          style={{
            width: "100%",
            minHeight: 80,
            padding: 10,
            fontSize: 13,
            fontFamily: "Consolas, monospace",
            background: "#2a2a2a",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 4,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSavePreload}
          style={{
            marginTop: 8,
            padding: "6px 16px",
            background: "#ff9800",
            color: "#222",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: "bold",
          }}
        >
          Save Preload Messages
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 14,
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          Postload Messages
        </label>
        <div
          style={{
            fontSize: 12,
            color: "#aaa",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          Messages sent <strong>after</strong> the load command. One message per
          line. Each message will be sent with Enter before and after.
        </div>
        <textarea
          value={postloadText}
          onChange={(e) => setPostloadText(e.target.value)}
          placeholder="Enter messages (one per line)&#10;Example:&#10;Character loaded successfully!&#10;Ready to play"
          style={{
            width: "100%",
            minHeight: 80,
            padding: 10,
            fontSize: 13,
            fontFamily: "Consolas, monospace",
            background: "#2a2a2a",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 4,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSavePostload}
          style={{
            marginTop: 8,
            padding: "6px 16px",
            background: "#ff9800",
            color: "#222",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: "bold",
          }}
        >
          Save Postload Messages
        </button>
      </div>

      {saveStatus && (
        <div
          style={{
            padding: 10,
            background: "#4caf50",
            color: "#fff",
            borderRadius: 4,
            fontSize: 13,
            marginTop: 10,
          }}
        >
          {saveStatus}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: "#3a3a3a",
          borderRadius: 4,
          fontSize: 12,
          color: "#ccc",
          lineHeight: 1.6,
        }}
      >
        <strong>How it works:</strong>
        <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
          <li>Each line is treated as a separate message</li>
          <li>Empty lines are ignored</li>
          <li>
            Messages are sent automatically: <code>Enter → Message → Enter</code>
          </li>
          <li>Preload messages are sent before the load code</li>
          <li>Postload messages are sent after the load code</li>
        </ul>
      </div>
    </div>
  );
};

export default LoaderSettings;
