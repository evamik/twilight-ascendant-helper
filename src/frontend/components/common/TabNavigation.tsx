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
  label: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: Tab[] = [
    { id: "loader", label: "🔄 Loader" },
    { id: "drops", label: "📦 Drops" },
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
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
