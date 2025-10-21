/**
 * TabNavigation Component
 * Renders tab navigation UI for switching between different views
 * Separated from index.jsx to maintain SRP
 */

import React from 'react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'loader', label: '🔄 Loader' },
    { id: 'drops', label: '📦 Drops' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '20px',
      borderBottom: '2px solid #333',
      paddingBottom: '0'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 24px',
            background: activeTab === tab.id ? '#ff9800' : 'transparent',
            color: activeTab === tab.id ? '#222' : '#fff',
            border: 'none',
            borderBottom: activeTab === tab.id ? '3px solid #ff9800' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
