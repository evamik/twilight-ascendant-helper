import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AccountList from './components/AccountList';
import CharacterList from './components/CharacterList';
import CharacterData from './components/CharacterData';
import { useAccountCharacterNavigation } from './hooks/useAccountCharacterNavigation';

const { ipcRenderer } = window.require ? window.require('electron') : {};

const App = () => {
  const [overlayEnabled, setOverlayEnabled] = useState(false);
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

  const handleOverlayToggle = (checked) => {
    setOverlayEnabled(checked);
    if (ipcRenderer) {
      ipcRenderer.send('toggle-overlay', checked);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      minHeight: '100vh',
      background: '#1e1e1e',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ margin: '0 0 20px 0', color: '#fff' }}>Twilight Ascendant Helper</h1>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={overlayEnabled}
          onChange={e => handleOverlayToggle(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <span>Enable Overlay</span>
      </label>

      <div style={{ marginTop: '20px' }}>
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
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
