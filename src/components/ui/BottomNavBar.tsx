import React from 'react';
import { FloatingNavBar, type FloatingNavTab } from './FloatingNavBar';

export type BottomNavTab = FloatingNavTab;

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  unreadCount?: number;
  onOpenAddModal?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount,
}) => {
  return (
    <FloatingNavBar
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      unreadCount={unreadCount}
    />
  );
};

export { FloatingNavBar };
