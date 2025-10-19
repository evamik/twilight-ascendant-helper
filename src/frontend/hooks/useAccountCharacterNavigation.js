import { useState, useEffect } from "react";

const { ipcRenderer } = window.require ? window.require("electron") : {};

export const useAccountCharacterNavigation = () => {
  const [accounts, setAccounts] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterData, setCharacterData] = useState(null);

  // Load accounts on mount and when settings change
  const loadAccounts = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke("get-account-folders").then((folders) => {
        setAccounts(folders);
      });
    }
  };

  useEffect(() => {
    loadAccounts();

    // Listen for settings changes
    if (ipcRenderer) {
      const handleSettingsChanged = () => {
        console.log("Settings changed, reloading accounts...");
        // Reset navigation state
        setSelectedAccount(null);
        setSelectedCharacter(null);
        setCharacterData(null);
        setCharacters([]);
        // Reload accounts
        loadAccounts();
      };

      ipcRenderer.on("settings-changed", handleSettingsChanged);

      return () => {
        ipcRenderer.removeListener("settings-changed", handleSettingsChanged);
      };
    }
  }, []);

  const handleAccountClick = (accountName) => {
    if (ipcRenderer) {
      ipcRenderer
        .invoke("get-character-folders", accountName)
        .then((folders) => {
          setCharacters(folders);
          setSelectedAccount(accountName);
          setSelectedCharacter(null);
          setCharacterData(null);
        });
    }
  };

  const handleCharacterClick = (characterName) => {
    setSelectedCharacter(characterName);
    loadCharacterData(characterName);
  };

  const loadCharacterData = (characterName) => {
    if (ipcRenderer && selectedAccount) {
      ipcRenderer
        .invoke(
          "get-character-data",
          selectedAccount,
          characterName || selectedCharacter
        )
        .then((data) => {
          setCharacterData(data);
        });
    }
  };

  const handleBackClick = () => {
    if (selectedCharacter) {
      // Go back to character list
      setSelectedCharacter(null);
      setCharacterData(null);
    } else {
      // Go back to account list
      setSelectedAccount(null);
      setCharacters([]);
    }
  };

  return {
    accounts,
    characters,
    selectedAccount,
    selectedCharacter,
    characterData,
    handleAccountClick,
    handleCharacterClick,
    handleBackClick,
    loadCharacterData,
  };
};
