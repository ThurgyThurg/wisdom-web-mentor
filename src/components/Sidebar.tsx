import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  Terminal,
  Home,
  Settings,
  BookOpen,
  StickyNote,
  CheckSquare,
  GraduationCap,
  MessageSquare,
  Bot,
  Webhook,
  Upload,
  User
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { 
      icon: Home, 
      label: 'DASHBOARD', 
      path: '/',
      description: 'Overview & Analytics'
    },
    { 
      icon: BookOpen, 
      label: 'RESOURCES', 
      path: '/resources',
      description: 'Learning Materials'
    },
    { 
      icon: StickyNote, 
      label: 'NOTES', 
      path: '/notes',
      description: 'Knowledge Base'
    },
    { 
      icon: CheckSquare, 
      label: 'TASKS', 
      path: '/tasks',
      description: 'Task Management'
    },
    { 
      icon: GraduationCap, 
      label: 'LEARNING PLANS', 
      path: '/learning-plans',
      description: 'Study Roadmaps'
    },
    { 
      icon: Bot, 
      label: 'AI AGENTS', 
      path: '/agents',
      description: 'AI Assistants'
    },
    { 
      icon: MessageSquare, 
      label: 'CHAT', 
      path: '/chat',
      description: 'AI Conversations'
    },
    { 
      icon: Webhook, 
      label: 'AUTOMATIONS', 
      path: '/automations',
      description: 'N8N Workflows'
    },
    { 
      icon: Settings, 
      label: 'SETTINGS', 
      path: '/settings',
      description: 'System Config'
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className={cn('pb-12 min-h-screen bg-gray-950 border-r-2 border-green-500', className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-bold text-green-400 font-mono">
              LEARNAI
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      'w-full justify-start h-auto p-3 font-mono text-left',
                      isActive
                        ? 'bg-green-600 text-black hover:bg-green-700'
                        : 'text-green-400 hover:text-green-300 hover:bg-green-900/20'
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-xs opacity-70 font-normal">
                        {item.description}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };
