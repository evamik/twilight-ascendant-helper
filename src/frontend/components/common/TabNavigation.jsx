/**
 * TabNavigation Component
 * Renders tab navigation UI for switching between different views
 * Separated from index.jsx to maintain SRP
 */

import React from 'react';
import styles from './TabNavigation.module.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'loader', label: '🔄 Loader' },
    { id: 'drops', label: '📦 Drops' }
  ];

  return (
    <div className={styles.container}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={activeTab === tab.id ? styles.tabActive : styles.tabInactive}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
