
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Home, FileText, CheckSquare, BookOpen, Upload, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TerminalHeader = () => {
  return (
    <header className="bg-black border-b border-green-500 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-green-400 font-mono">
            [AGENTIC_AI_SYSTEM]
          </h1>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <Home className="w-4 h-4" />
              CHAT
            </Link>
            <Link to="/documents" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <Upload className="w-4 h-4" />
              DOCUMENTS
            </Link>
            <Link to="/agents" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AGENTS
            </Link>
            <Link to="/notes" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <FileText className="w-4 h-4" />
              NOTES
            </Link>
            <Link to="/tasks" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              TASKS
            </Link>
            <Link to="/learning-plans" className="text-green-400 hover:text-green-300 font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              LEARNING
            </Link>
          </nav>
        </div>
        <Link to="/settings">
          <Button variant="outline" className="font-mono bg-black border-green-500 text-green-400 hover:bg-green-900 hover:text-green-300">
            <Settings className="w-4 h-4 mr-2" />
            SETTINGS
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default TerminalHeader;
