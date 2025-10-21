/**
 * OverlayToggle Component
 * Manages overlay enabled state with IPC communication
 * Separated from index.jsx to maintain SRP
 */

import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require ? window.require('electron') : {};

const OverlayToggle = () => {
  const [overlayEnabled, setOverlayEnabled] = useState(false);

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

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={overlayEnabled}
        onChange={e => handleOverlayToggle(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
      <span>Enable Overlay</span>
    </label>
  );
};

export default OverlayToggle;
