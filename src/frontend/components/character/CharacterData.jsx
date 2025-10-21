import React, { useState } from 'react';
import CharacterMessageSettings from './CharacterMessageSettings';

const { ipcRenderer } = window.require ? window.require('electron') : {};

const CharacterData = ({ accountName, characterName, characterData, onBack, onLoad, buttonStyle }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    
    try {
      // Send the load command to the game with character data and account/character names
      if (ipcRenderer && characterData) {
        const result = await ipcRenderer.invoke('send-load-command', characterData, accountName, characterName);
        if (!result.success) {
          console.error('Failed to send load command:', result.error);
          alert(`Failed to load: ${result.error}`);
        } else {
          console.log('Load command sent successfully');
        }
      } else if (!characterData) {
        console.error('No character data available');
        alert('No character data available. Please wait for data to load.');
      }
      
      // Then, refresh the character data
      if (onLoad) {
        onLoad();
      }
    } finally {
      // Re-enable button after 3 seconds (load sequence takes time)
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <>
      <button
        onClick={handleLoad}
        disabled={isLoading}
        style={{
          marginBottom: 10,
          padding: '8px 12px',
          background: isLoading ? '#999' : '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          opacity: isLoading ? 0.6 : 1,
          ...buttonStyle,
        }}
      >
        {isLoading ? '⏳ Loading...' : '🔄 Load'}
      </button>

      {/* Character-specific message settings (separate component) */}
      <CharacterMessageSettings accountName={accountName} characterName={characterName} />

      <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>
        {characterName}
      </h2>
      {characterData ? (
        <>
          <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#aaa' }}>
            File: {characterData.fileName}
          </p>
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: 10,
              borderRadius: 4,
              textAlign: 'left',
              fontSize: 12,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {characterData.content}
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 14 }}>No data found. Click Load to refresh.</p>
      )}
    </>
  );
};

export default CharacterData;
