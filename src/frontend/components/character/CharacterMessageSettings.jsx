import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require ? window.require('electron') : {};

/**
 * CharacterMessageSettings Component
 * Handles per-character preload/postload message configuration
 * Shows collapsible settings section with save, clear, and use global actions
 */
const CharacterMessageSettings = ({ accountName, characterName }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [preloadText, setPreloadText] = useState('');
  const [postloadText, setPostloadText] = useState('');
  const [globalPreload, setGlobalPreload] = useState([]);
  const [globalPostload, setGlobalPostload] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasCharacterSettings, setHasCharacterSettings] = useState(false);

  // Load character settings on mount or when character changes
  useEffect(() => {
    if (ipcRenderer && accountName && characterName) {
      loadCharacterSettings();
    }
  }, [accountName, characterName]);

  const loadCharacterSettings = async () => {
    if (!ipcRenderer) return;

    try {
      const result = await ipcRenderer.invoke('get-character-settings', accountName, characterName);
      const { characterSettings, globalSettings } = result;

      // Store global settings for reference
      setGlobalPreload(globalSettings.preloadMessages || []);
      setGlobalPostload(globalSettings.postloadMessages || []);

      if (characterSettings) {
        // Character has custom settings
        setHasCharacterSettings(true);
        setPreloadText((characterSettings.preloadMessages || []).join('\n'));
        setPostloadText((characterSettings.postloadMessages || []).join('\n'));
      } else {
        // No custom settings, show empty (will use global)
        setHasCharacterSettings(false);
        setPreloadText('');
        setPostloadText('');
      }
    } catch (error) {
      console.error('Error loading character settings:', error);
    }
  };

  const handleSavePreload = async () => {
    if (!ipcRenderer) return;

    const messages = preloadText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = await ipcRenderer.invoke('set-character-preload', accountName, characterName, messages);
    if (result.success) {
      setHasCharacterSettings(true);
      setSaveStatus('Preload messages saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleSavePostload = async () => {
    if (!ipcRenderer) return;

    const messages = postloadText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = await ipcRenderer.invoke('set-character-postload', accountName, characterName, messages);
    if (result.success) {
      setHasCharacterSettings(true);
      setSaveStatus('Postload messages saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleClear = async () => {
    if (!ipcRenderer) return;

    const result = await ipcRenderer.invoke('clear-character-settings', accountName, characterName);
    if (result.success) {
      setHasCharacterSettings(false);
      setPreloadText('');
      setPostloadText('');
      setSaveStatus('Settings cleared! Using global settings.');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleUseGlobal = () => {
    setPreloadText(globalPreload.join('\n'));
    setPostloadText(globalPostload.join('\n'));
  };

  return (
    <div style={{ marginBottom: 15, background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 4 }}>
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#ff9800',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>⚙️ Preload/Postload Messages</span>
        <span>{showSettings ? '▼' : '▶'}</span>
      </button>

      {showSettings && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, lineHeight: 1.4 }}>
            {hasCharacterSettings ? (
              <span style={{ color: '#4caf50' }}>✓ Using custom settings for this character</span>
            ) : (
              <span>Using global settings. Set custom messages below to override.</span>
            )}
          </div>

          {/* Preload Messages */}
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
              Preload Messages
            </label>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>
              Sent <strong>before</strong> loading. One per line.
              {globalPreload.length > 0 && !hasCharacterSettings && (
                <span style={{ display: 'block', marginTop: 3, color: '#ff9800' }}>
                  Global: {globalPreload.join(', ')}
                </span>
              )}
            </div>
            <textarea
              value={preloadText}
              onChange={(e) => setPreloadText(e.target.value)}
              placeholder="Enter custom preload messages&#10;Leave empty to use global settings"
              style={{
                width: '100%',
                minHeight: 60,
                padding: 8,
                fontSize: 12,
                fontFamily: 'Consolas, monospace',
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: 4,
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleSavePreload}
              style={{
                marginTop: 5,
                padding: '6px 10px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            >
              Save Preload
            </button>
          </div>

          {/* Postload Messages */}
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
              Postload Messages
            </label>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>
              Sent <strong>after</strong> loading. One per line.
              {globalPostload.length > 0 && !hasCharacterSettings && (
                <span style={{ display: 'block', marginTop: 3, color: '#ff9800' }}>
                  Global: {globalPostload.join(', ')}
                </span>
              )}
            </div>
            <textarea
              value={postloadText}
              onChange={(e) => setPostloadText(e.target.value)}
              placeholder="Enter custom postload messages&#10;Leave empty to use global settings"
              style={{
                width: '100%',
                minHeight: 60,
                padding: 8,
                fontSize: 12,
                fontFamily: 'Consolas, monospace',
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: 4,
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleSavePostload}
              style={{
                marginTop: 5,
                padding: '6px 10px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            >
              Save Postload
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleUseGlobal}
              style={{
                padding: '6px 10px',
                background: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Use Global
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '6px 10px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Clear
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#4caf50', fontWeight: 'bold' }}>
              {saveStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterMessageSettings;
