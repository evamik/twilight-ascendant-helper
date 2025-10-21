/**
 * Main Application Entry Point
 * Thin shell that composes feature components
 * Refactored to maintain SRP - delegates to specialized components
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Settings from './components/settings/Settings';
import LoaderView from './components/loader/LoaderView';
import Drops from './components/drops/Drops';
import TabNavigation from './components/common/TabNavigation';
import OverlayToggle from './components/common/OverlayToggle';

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('loader'); // 'loader' or 'drops'

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsBack = () => {
    setShowSettings(false);
    // Reload accounts in case the directory changed
    window.location.reload();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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
      {/* App Header */}
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

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Overlay Toggle */}
      <OverlayToggle />

      {/* Tab Content */}
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'loader' && <LoaderView />}
        {activeTab === 'drops' && <Drops />}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
