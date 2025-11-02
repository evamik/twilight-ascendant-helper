import { useState, useEffect } from "react";
import type { IpcRenderer } from "../types/electron";
import type { CharacterData, CharacterSummary } from "../types";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface UseAccountCharacterNavigationReturn {
  accounts: string[];
  characters: CharacterSummary[];
  selectedAccount: string | null;
  selectedCharacter: string | null;
  characterData: CharacterData | null;
  isLoading: boolean;
  handleAccountClick: (accountName: string) => void;
  handleCharacterClick: (characterName: string) => void;
  handleBackClick: () => void;
  loadCharacterData: (characterName?: string) => void;
}

export const useAccountCharacterNavigation =
  (): UseAccountCharacterNavigationReturn => {
    const [accounts, setAccounts] = useState<string[]>([]);
    const [characters, setCharacters] = useState<CharacterSummary[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
      null
    );
    const [characterData, setCharacterData] = useState<CharacterData | null>(
      null
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
      const initialize = async () => {
        if (!ipcRenderer) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        // Load accounts first
        const folders = await ipcRenderer.invoke("get-account-folders");
        setAccounts(folders);

        // Check for last used account
        const settings = await ipcRenderer.invoke("get-ui-settings");
        if (settings.lastUsedAccount) {
          // Auto-navigate to last used account (load characters)
          const characterSummaries = await ipcRenderer.invoke(
            "get-character-summaries",
            settings.lastUsedAccount
          );
          setCharacters(characterSummaries);
          setSelectedAccount(settings.lastUsedAccount);
        }

        // Done loading - now safe to render
        setIsLoading(false);
      };

      initialize();

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
          initialize();
        };

        ipcRenderer.on("settings-changed", handleSettingsChanged);

        return () => {
          ipcRenderer.removeListener("settings-changed", handleSettingsChanged);
        };
      }

      return undefined;
    }, []);

    // Listen for character file changes to update summaries
    useEffect(() => {
      if (!ipcRenderer || !selectedAccount) return;

      const handleCharacterFileChange = (
        _event: any,
        data: { accountName: string; characterName: string }
      ) => {
        if (data.accountName === selectedAccount) {
          console.log(
            `[Navigation] Character file changed: ${data.characterName}, reloading summaries...`
          );
          // Reload character summaries for this account
          ipcRenderer
            .invoke("get-character-summaries", selectedAccount)
            .then((summaries: CharacterSummary[]) => {
              setCharacters(summaries);
            });
        }
      };

      ipcRenderer.on("character-file-changed", handleCharacterFileChange);

      return () => {
        ipcRenderer.removeListener(
          "character-file-changed",
          handleCharacterFileChange
        );
      };
    }, [selectedAccount, ipcRenderer]);

    const handleAccountClick = (accountName: string) => {
      if (ipcRenderer) {
        setIsLoading(true);
        ipcRenderer
          .invoke("get-character-summaries", accountName)
          .then((summaries: CharacterSummary[]) => {
            setCharacters(summaries);
            setSelectedAccount(accountName);
            setSelectedCharacter(null);
            setCharacterData(null);
            setIsLoading(false);

            // Save as last used account
            ipcRenderer.invoke("set-last-used-account", accountName);
          });
      }
    };

    const handleCharacterClick = (characterName: string) => {
      setIsLoading(true);
      setSelectedCharacter(characterName);
      loadCharacterData(characterName);
    };

    const loadCharacterData = (characterName?: string) => {
      if (ipcRenderer && selectedAccount) {
        setIsLoading(true);
        ipcRenderer
          .invoke(
            "get-character-data",
            selectedAccount,
            characterName || selectedCharacter
          )
          .then((data: CharacterData) => {
            setCharacterData(data);
            setIsLoading(false);
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
      isLoading,
      handleAccountClick,
      handleCharacterClick,
      handleBackClick,
      loadCharacterData,
    };
  };
