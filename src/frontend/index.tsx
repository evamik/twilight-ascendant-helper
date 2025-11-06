/**
 * Main Application Entry Point
 * Thin shell that composes feature components
 * Refactored to maintain SRP - delegates to specialized components
 */

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles/variables.css";
import styles from "./index.module.css";
import Settings from "./components/settings/Settings";
import LoaderView from "./components/loader/LoaderView";
import Drops from "./components/drops/Drops";
import Guide from "./components/guide/Guide";
import TabNavigation from "./components/common/TabNavigation";
import OverlayToggle from "./components/common/OverlayToggle";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("loader"); // 'loader' or 'drops'
  const [appScale, setAppScale] = useState<number>(1);

  // Load main app scale from settings
  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: { invoke: (channel: string) => Promise<any> };
      };
      ipcRenderer.invoke("get-main-app-scale").then((scale: number) => {
        setAppScale(scale);
      });
    }
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsBack = () => {
    setShowSettings(false);
    // Reload accounts in case the directory changed
    window.location.reload();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (showSettings) {
    return (
      <div className={styles.app} style={{ zoom: appScale }}>
        <Settings onBack={handleSettingsBack} />
      </div>
    );
  }

  return (
    <div className={styles.app} style={{ zoom: appScale }}>
      {/* App Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Twilight Ascendant Helper</h1>
        <button onClick={handleSettingsClick} className={styles.settingsButton}>
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Overlay Toggle - hide when viewing guide */}
      {activeTab !== "guide" && <OverlayToggle />}

      {/* Tab Content */}
      <div
        className={styles.content}
        style={
          activeTab === "guide"
            ? { height: "calc(100vh - 160px)", overflow: "hidden" }
            : {}
        }
      >
        {activeTab === "loader" && <LoaderView />}
        {activeTab === "drops" && <Drops />}
        {activeTab === "guide" && <Guide />}
      </div>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
