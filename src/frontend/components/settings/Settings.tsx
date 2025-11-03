import React, { useRef } from "react";
import styles from "./Settings.module.css";
import DataDirectorySettings from "./DataDirectorySettings";
import LoaderSettings from "./LoaderSettings";
import ReplayDirectorySettings from "./ReplayDirectorySettings";
import UpdateSettings from "./UpdateSettings";
import TagManager from "./TagManager";
import KeybindSettings from "./KeybindSettings";
import UIScaleSettings from "./UIScaleSettings";
import SettingsNavigation, { SettingsSection } from "./SettingsNavigation";

interface SettingsProps {
  onBack: () => void;
  showBackButton?: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  showBackButton = true,
}) => {
  // Refs for scrolling to sections
  const updateRef = useRef<HTMLDivElement>(null);
  const uiScaleRef = useRef<HTMLDivElement>(null);
  const dataDirectoryRef = useRef<HTMLDivElement>(null);
  const replayDirectoryRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const keybindsRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Sections for navigation
  const sections: SettingsSection[] = [
    { ref: updateRef, label: "Updates", id: "updates" },
    { ref: uiScaleRef, label: "UI Scale", id: "ui-scale" },
    { ref: dataDirectoryRef, label: "Data Dir", id: "data-directory" },
    { ref: replayDirectoryRef, label: "Replay Dir", id: "replay-directory" },
    { ref: tagsRef, label: "Tags", id: "tags" },
    { ref: keybindsRef, label: "Keybinds", id: "keybinds" },
    { ref: loaderRef, label: "Loader", id: "loader" },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Settings</h2>

      {/* Settings Navigation */}
      <SettingsNavigation
        sections={sections}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      {/* Update Settings Section */}
      <div ref={updateRef} className={styles.section} id="updates">
        <UpdateSettings />
      </div>

      {/* UI Scale Settings Section */}
      <div ref={uiScaleRef} className={styles.section} id="ui-scale">
        <UIScaleSettings />
      </div>

      {/* Data Directory Settings Section */}
      <div
        ref={dataDirectoryRef}
        className={styles.section}
        id="data-directory"
      >
        <DataDirectorySettings />
      </div>

      {/* Replay Directory Settings Section */}
      <div
        ref={replayDirectoryRef}
        className={styles.section}
        id="replay-directory"
      >
        <ReplayDirectorySettings />
      </div>

      {/* Tag Manager Section */}
      <div ref={tagsRef} className={styles.section} id="tags">
        <TagManager />
      </div>

      {/* Keybind Settings Section */}
      <div ref={keybindsRef} className={styles.section} id="keybinds">
        <KeybindSettings />
      </div>

      {/* Loader Settings Section */}
      <div ref={loaderRef} className={styles.sectionLast} id="loader">
        <LoaderSettings />
      </div>
    </div>
  );
};

export default Settings;
