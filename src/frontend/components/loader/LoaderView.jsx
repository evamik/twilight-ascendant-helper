/**
 * LoaderView Component
 * Handles all loader routing logic (accounts → characters → character data)
 * Separated from index.jsx to maintain SRP
 */

import React from 'react';
import AccountList from '../character/AccountList';
import CharacterList from '../character/CharacterList';
import CharacterData from '../character/CharacterData';
import { useAccountCharacterNavigation } from '../../hooks/useAccountCharacterNavigation';

const LoaderView = () => {
  const {
    accounts,
    characters,
    selectedAccount,
    selectedCharacter,
    characterData,
    handleAccountClick,
    handleCharacterClick,
    handleBackClick,
    loadCharacterData,
  } = useAccountCharacterNavigation();

  return (
    <div>
      {selectedAccount && (
        <button
          onClick={handleBackClick}
          style={{
            padding: '8px 16px',
            background: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: '16px'
          }}
        >
          ← Back
        </button>
      )}
      
      {selectedCharacter ? (
        <CharacterData
          accountName={selectedAccount}
          characterName={selectedCharacter}
          characterData={characterData}
          onBack={handleBackClick}
          onLoad={() => loadCharacterData()}
        />
      ) : selectedAccount ? (
        <CharacterList
          accountName={selectedAccount}
          characters={characters}
          onBack={handleBackClick}
          onCharacterClick={handleCharacterClick}
          showBackButton={false}
          buttonStyle={{ background: '#ff9800', color: '#222' }}
        />
      ) : (
        <>
          <h2 style={{ color: '#fff' }}>Accounts</h2>
          <div style={{ maxWidth: 300 }}>
            <AccountList
              accounts={accounts}
              onAccountClick={handleAccountClick}
              buttonStyle={{ background: '#ff9800', color: '#222' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LoaderView;
