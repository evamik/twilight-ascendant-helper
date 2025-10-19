import { useState, useEffect } from "react";

const { ipcRenderer } = window.require ? window.require("electron") : {};

export const useAccountCharacterNavigation = () => {
  const [accounts, setAccounts] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterData, setCharacterData] = useState(null);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.invoke("get-account-folders").then((folders) => {
        setAccounts(folders);
      });
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
