import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AccountList from './components/character/AccountList';
import CharacterList from './components/character/CharacterList';
import CharacterData from './components/character/CharacterData';
import Settings from './components/settings/Settings';
import { useAccountCharacterNavigation } from './hooks/useAccountCharacterNavigation';

const { ipcRenderer } = window.require ? window.require('electron') : {};

const App = () => {
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  // Load overlay enabled state from settings on mount
  useEffect(() => {
    const loadUISettings = async () => {
      if (!ipcRenderer) return;
      
      try {
        const uiSettings = await ipcRenderer.invoke('get-ui-settings');
        if (uiSettings.overlayEnabled !== undefined) {
          setOverlayEnabled(uiSettings.overlayEnabled);
          // Backend already loaded this state on startup, so no need to send toggle-overlay here
          // Just sync the UI checkbox state
        }
      } catch (error) {
        console.error('Error loading UI settings:', error);
      }
    };

    loadUISettings();
  }, []);

  const handleOverlayToggle = async (checked) => {
    setOverlayEnabled(checked);
    if (ipcRenderer) {
      ipcRenderer.send('toggle-overlay', checked);
      // Save preference
      try {
        await ipcRenderer.invoke('set-overlay-enabled', checked);
      } catch (error) {
        console.error('Error saving overlay preference:', error);
      }
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsBack = () => {
    setShowSettings(false);
    // Reload accounts in case the directory changed
    window.location.reload();
  };

  if (showSettings) {
    return <Settings onBack={handleSettingsBack} />;
  }

  return (
    <div style={{ 
      padding: '20px',
      minHeight: '100vh',
      background: '#1e1e1e',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#fff' }}>Twilight Ascendant Helper</h1>
        <button
          onClick={handleSettingsClick}
          style={{
            padding: '8px 16px',
            background: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ⚙️ Settings
        </button>
      </div>
      
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
