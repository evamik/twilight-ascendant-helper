import React from "react";
import styles from "./Settings.module.css";
import DataDirectorySettings from "./DataDirectorySettings";
import LoaderSettings from "./LoaderSettings";
import ReplayDirectorySettings from "./ReplayDirectorySettings";
import UpdateSettings from "./UpdateSettings";

interface SettingsProps {
  onBack: () => void;
  showBackButton?: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  showBackButton = true,
}) => {
  return (
    <div className={styles.container}>
      {showBackButton && (
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
      )}

      <h2 className={styles.title}>Settings</h2>

      {/* Update Settings Section */}
      <div className={styles.section}>
        <UpdateSettings />
      </div>

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
