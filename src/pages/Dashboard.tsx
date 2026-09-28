import React from 'react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <AnalyticsDashboard />
    </div>
  );
};