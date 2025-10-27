import { useState, useEffect } from "react";
import type { IpcRenderer } from "../types/electron";
import type { CharacterData } from "../types";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface UseAccountCharacterNavigationReturn {
  accounts: string[];
  characters: string[];
  selectedAccount: string | null;
  selectedCharacter: string | null;
  characterData: CharacterData | null;
  handleAccountClick: (accountName: string) => void;
  handleCharacterClick: (characterName: string) => void;
  handleBackClick: () => void;
  loadCharacterData: (characterName?: string) => void;
}

export const useAccountCharacterNavigation =
  (): UseAccountCharacterNavigationReturn => {
    const [accounts, setAccounts] = useState<string[]>([]);
    const [characters, setCharacters] = useState<string[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
      null
    );
    const [characterData, setCharacterData] = useState<CharacterData | null>(
      null
    );

    // Load accounts on mount and when settings change
    const loadAccounts = () => {
      if (ipcRenderer) {
        ipcRenderer.invoke("get-account-folders").then((folders: string[]) => {
          setAccounts(folders);
        });
      }
    };

    useEffect(() => {
      loadAccounts();

      // Load last used account and auto-navigate
      if (ipcRenderer) {
        ipcRenderer.invoke("get-ui-settings").then((settings: any) => {
          if (settings.lastUsedAccount) {
            // Auto-navigate to last used account
            handleAccountClick(settings.lastUsedAccount);
          }
        });
      }

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

      return undefined;
    }, []);

    const handleAccountClick = (accountName: string) => {
      if (ipcRenderer) {
        ipcRenderer
          .invoke("get-character-folders", accountName)
          .then((folders: string[]) => {
            setCharacters(folders);
            setSelectedAccount(accountName);
            setSelectedCharacter(null);
            setCharacterData(null);
            
            // Save as last used account
            ipcRenderer.invoke("set-last-used-account", accountName);
          });
      }
    };

    const handleCharacterClick = (characterName: string) => {
      setSelectedCharacter(characterName);
      loadCharacterData(characterName);
    };

    const loadCharacterData = (characterName?: string) => {
      if (ipcRenderer && selectedAccount) {
        ipcRenderer
          .invoke(
            "get-character-data",
            selectedAccount,
            characterName || selectedCharacter
          )
          .then((data: CharacterData) => {
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
