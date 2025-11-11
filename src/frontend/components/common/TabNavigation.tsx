/**
 * TabNavigation Component
 * Renders tab navigation UI for switching between different views
 * Separated from index.tsx to maintain SRP
 */

import React from "react";
import styles from "./TabNavigation.module.css";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

interface Tab {
  id: string;
  icon: string;
  label: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: Tab[] = [
    { id: "loader", icon: "🔄", label: "Loader" },
    { id: "inventory", icon: "🎒", label: "Inventory" },
    { id: "drops", icon: "📦", label: "Drops" },
    { id: "guide", icon: "📚", label: "Guide" },
  ];

  return (
    <div className={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={
            activeTab === tab.id ? styles.tabActive : styles.tabInactive
          }
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
