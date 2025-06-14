
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Terminal, Power, User } from 'lucide-react';

const TerminalHeader = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-black border-b-2 border-green-500 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-500 font-mono">LEARNAI TERMINAL</h1>
            <p className="text-green-400 text-sm font-mono">
              user@terminal:~$ active_session
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
            <User className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
          >
            <Power className="w-4 h-4 mr-2" />
            LOGOUT
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TerminalHeader;
