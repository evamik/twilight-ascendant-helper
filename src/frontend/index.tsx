/**
 * Main Application Entry Point
 * Thin shell that composes feature components
 * Refactored to maintain SRP - delegates to specialized components
 */

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./index.module.css";
import Settings from "./components/settings/Settings";
import LoaderView from "./components/loader/LoaderView";
import Drops from "./components/drops/Drops";
import TabNavigation from "./components/common/TabNavigation";
import OverlayToggle from "./components/common/OverlayToggle";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("loader"); // 'loader' or 'drops'

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
    return <Settings onBack={handleSettingsBack} />;
  }

  return (
    <div className={styles.app}>
      {/* App Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Twilight Ascendant Helper</h1>
        <button onClick={handleSettingsClick} className={styles.settingsButton}>
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Overlay Toggle */}
      <OverlayToggle />

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === "loader" && <LoaderView />}
        {activeTab === "drops" && <Drops />}
      </div>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
