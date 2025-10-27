import React from "react";
import DirectorySettings from "./DirectorySettings";

/**
 * ReplayDirectorySettings Component
 * Manages the Warcraft III replay directory settings
 */
const ReplayDirectorySettings: React.FC = () => {
  return (
    <DirectorySettings
      title="Replay Directory"
      helpText="The replay directory should be your Warcraft III BattleNet folder. The app will search for LastReplay.w3g in account subfolders. By default: Documents\Warcraft III\BattleNet"
      getPathHandler="get-replay-directory"
      chooseHandler="choose-replay-directory"
      resetHandler="reset-replay-directory"
      titleColor="#ff9800"
    />
  );
};

export default ReplayDirectorySettings;
