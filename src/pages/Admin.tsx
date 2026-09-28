import React from 'react';
import { TeacherDashboard } from '../components/TeacherDashboard';

export const Admin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <TeacherDashboard />
    </div>
  );
};