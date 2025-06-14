
import React from 'react';
import TerminalHeader from '@/components/TerminalHeader';
import TaskManager from '@/components/TaskManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Tasks = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-400 font-mono mb-4">
              [TASK_MANAGEMENT_SYSTEM]
            </h1>
            <p className="text-green-300 font-mono text-lg">
              Organize your work with intelligent task management. Create, prioritize, and track progress.
            </p>
          </div>
          <TaskManager />
        </div>
      </div>
    </div>
  );
};

export default Tasks;
