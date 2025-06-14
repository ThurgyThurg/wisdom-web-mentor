
import React from 'react';
import TerminalHeader from '@/components/TerminalHeader';
import CustomAgentManager from '@/components/CustomAgentManager';

const Agents = () => {
  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <CustomAgentManager />
        </div>
      </div>
    </div>
  );
};

export default Agents;
