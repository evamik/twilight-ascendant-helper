import React from "react";
import styles from "./Settings.module.css";
import DataDirectorySettings from "./DataDirectorySettings";
import LoaderSettings from "./LoaderSettings";
import ReplayDirectorySettings from "./ReplayDirectorySettings";
import UpdateSettings from "./UpdateSettings";
import TagManager from "./TagManager";
import KeybindSettings from "./KeybindSettings";
import UIScaleSettings from "./UIScaleSettings";
import { Button } from "../common/buttons";

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
        <Button
          onClick={onBack}
          variant="secondary"
          className={styles.backButton}
        >
          ← Back
        </Button>
      )}

      <h2 className={styles.title}>Settings</h2>

      {/* Update Settings Section */}
      <div className={styles.section}>
        <UpdateSettings />
      </div>

      {/* UI Scale Settings Section */}
      <div className={styles.section}>
        <UIScaleSettings />
      </div>

      {/* Data Directory Settings Section */}
      <div className={styles.section}>
        <DataDirectorySettings />
      </div>

      {/* Replay Directory Settings Section */}
      <div className={styles.section}>
        <ReplayDirectorySettings />
      </div>

      {/* Tag Manager Section */}
      <div className={styles.section}>
        <TagManager />
      </div>

      {/* Keybind Settings Section */}
      <div className={styles.section}>
        <KeybindSettings />
      </div>

      {/* Loader Settings Section */}
      <div className={styles.sectionLast}>
        <LoaderSettings />
      </div>
    </div>
  );
};

export default Settings;
