/**
 * LoaderView Component
 * Handles all loader routing logic (accounts → characters → character data)
 * Separated from index.tsx to maintain SRP
 */

import React from "react";
import styles from "./LoaderView.module.css";
import AccountList from "../character/AccountList";
import CharacterList from "../character/CharacterList";
import CharacterData from "../character/CharacterData";
import { useAccountCharacterNavigation } from "../../hooks/useAccountCharacterNavigation";
import { Button } from "../common/buttons";

const LoaderView: React.FC = () => {
  const {
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
  } = useAccountCharacterNavigation();

  const handleQuickLoad = async (characterName: string) => {
    if (!window.require || !selectedAccount) return;
    
    const { ipcRenderer } = window.require("electron") as {
      ipcRenderer: any;
    };

    try {
      // Get character data
      const data = await ipcRenderer.invoke(
        "get-character-data",
        selectedAccount,
        characterName
      );
      
      // Send load command
      const result = await ipcRenderer.invoke(
        "send-load-command",
        data,
        selectedAccount,
        characterName
      );
      
      if (!result.success) {
        alert(`Failed to load character: ${result.error}`);
      }
    } catch (error) {
      console.error("Quick load error:", error);
      alert("Failed to load character");
    }
  };

  // Don't render content until data is loaded
  if (isLoading) {
    return null;
  }

  return (
    <div>
      {selectedCharacter ? (
        <CharacterData
          accountName={selectedAccount!}
          characterName={selectedCharacter}
          characterData={characterData}
          onBack={handleBackClick}
          onLoad={() => loadCharacterData()}
        />
      ) : selectedAccount ? (
        <>
          <Button
            onClick={handleBackClick}
            variant="secondary"
            className={styles.backButton}
          >
            ← Back
          </Button>
          <CharacterList
            accountName={selectedAccount}
            characters={characters}
            onBack={handleBackClick}
            onCharacterClick={handleCharacterClick}
            onLoad={handleQuickLoad}
            showBackButton={false}
            buttonStyle={{ background: "#ff9800", color: "#222" }}
          />
        </>
      ) : (
        <>
          <h2 className={styles.accountsTitle}>Accounts</h2>
          <div className={styles.accountsContainer}>
            <AccountList
              accounts={accounts}
              onAccountClick={handleAccountClick}
              buttonStyle={{ background: "#ff9800", color: "#222" }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LoaderView;
