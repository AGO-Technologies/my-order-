import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';

export const CustomerHomePage: React.FC = () => {
  return (
    <DashboardLayout>
      <Phase1PlaceholderCard pageTitle="Home" />
    </DashboardLayout>
  );
};
