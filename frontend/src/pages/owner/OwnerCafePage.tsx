import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';

export const OwnerCafePage: React.FC = () => {
  return (
    <DashboardLayout>
      <Phase1PlaceholderCard pageTitle="My Cafe" />
    </DashboardLayout>
  );
};
