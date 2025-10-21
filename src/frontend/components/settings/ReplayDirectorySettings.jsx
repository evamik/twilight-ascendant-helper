import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require ? window.require('electron') : {};

/**
 * ReplayDirectorySettings Component
 * Allows users to configure the replay base directory
 */
const ReplayDirectorySettings = () => {
  const [replayDirectory, setReplayDirectory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadReplayDirectory();
  }, []);

  const loadReplayDirectory = async () => {
    if (!ipcRenderer) return;

    try {
      setIsLoading(true);
      const directory = await ipcRenderer.invoke('get-replay-directory');
      setReplayDirectory(directory);
    } catch (error) {
      console.error('Error loading replay directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ipcRenderer) return;

    try {
      setSaveStatus('Saving...');
      const result = await ipcRenderer.invoke('set-replay-directory', replayDirectory);
      
      if (result.success) {
        setSaveStatus('✓ Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('✗ Failed to save');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      console.error('Error saving replay directory:', error);
      setSaveStatus('✗ Error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  if (isLoading) {
    return <div style={{ color: '#aaa' }}>Loading...</div>;
  }

  return (
    <div>
      <h3 style={{ color: 'white', marginBottom: 10, fontSize: 18 }}>
        Replay Directory
      </h3>
      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
        Set the base directory for Warcraft III replays. The app will search for
        LastReplay.w3g in account subfolders (e.g., BattleNet/422357159/Replays).
      </p>

      <div style={{ marginBottom: 10 }}>
        <label style={{ color: 'white', display: 'block', marginBottom: 5 }}>
          Replay Base Directory:
        </label>
        <input
          type="text"
          value={replayDirectory}
          onChange={(e) => setReplayDirectory(e.target.value)}
          placeholder="C:\Users\YourName\Documents\Warcraft III\BattleNet"
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'Consolas, monospace',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={!replayDirectory}
          style={{
            padding: '8px 16px',
            backgroundColor: replayDirectory ? '#2196f3' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: replayDirectory ? 'pointer' : 'not-allowed',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          Save
        </button>
        {saveStatus && (
          <span style={{ 
            color: saveStatus.includes('✓') ? '#4caf50' : '#f44336',
            fontSize: 14 
          }}>
            {saveStatus}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 15,
          padding: 10,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid #2196f3',
          borderRadius: 4,
          fontSize: 12,
          color: '#2196f3',
          lineHeight: 1.5,
        }}
      >
        <strong>💡 Default:</strong> C:\Users\YourName\Documents\Warcraft III\BattleNet\
        <br />
        The app will find the latest LastReplay.w3g across all account folders.
      </div>
    </div>
  );
};

export default ReplayDirectorySettings;
