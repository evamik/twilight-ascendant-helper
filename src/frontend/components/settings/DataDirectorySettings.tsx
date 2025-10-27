import React from "react";
import DirectorySettings from "./DirectorySettings";

/**
 * DataDirectorySettings Component
 * Manages the Twilight Ascendant data directory settings
 */
const DataDirectorySettings: React.FC = () => {
  return (
    <DirectorySettings
      title="Data Directory"
      helpText="The data directory should contain your account folders with character saves. By default, this is located at: Documents\Warcraft III\CustomMapData\Twilight Ascendant"
      getPathHandler="get-data-path"
      chooseHandler="choose-custom-directory"
      resetHandler="reset-to-default-directory"
      titleColor="#ff9800"
    />
  );
};

export default DataDirectorySettings;
