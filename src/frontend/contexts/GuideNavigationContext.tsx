import React, { createContext, useContext } from "react";

interface GuideNavigationContextType {
  navigateToGuide: (url: string) => void;
}

const GuideNavigationContext = createContext<
  GuideNavigationContextType | undefined
>(undefined);

export const GuideNavigationProvider: React.FC<{
  children: React.ReactNode;
  navigateToGuide: (url: string) => void;
}> = ({ children, navigateToGuide }) => {
  return (
    <GuideNavigationContext.Provider value={{ navigateToGuide }}>
      {children}
    </GuideNavigationContext.Provider>
  );
};

export const useGuideNavigation = () => {
  const context = useContext(GuideNavigationContext);
  if (!context) {
    throw new Error(
      "useGuideNavigation must be used within GuideNavigationProvider"
    );
  }
  return context;
};
