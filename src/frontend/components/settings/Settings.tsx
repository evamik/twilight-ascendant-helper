import React from "react";
import styles from "./Settings.module.css";
import DataDirectorySettings from "./DataDirectorySettings";
import LoaderSettings from "./LoaderSettings";
import ReplayDirectorySettings from "./ReplayDirectorySettings";

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  return (
    <div className={styles.container}>
      <button onClick={onBack} className={styles.backButton}>
        ← Back
      </button>

      <h2 className={styles.title}>Settings</h2>

      {/* Data Directory Settings Section */}
      <div className={styles.section}>
        <DataDirectorySettings />
      </div>

      {/* Replay Directory Settings Section */}
      <div className={styles.section}>
        <ReplayDirectorySettings />
      </div>

      {/* Loader Settings Section */}
      <div className={styles.sectionLast}>
        <LoaderSettings />
      </div>
    </div>
  );
};

export default Settings;
