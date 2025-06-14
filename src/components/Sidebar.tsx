
import { useState } from 'react';
import { Home, BookOpen, Brain, Upload, BarChart3, Settings, Webhook, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'webhooks', label: 'N8N Webhooks', icon: Webhook },
  ];

  const categories = [
    { name: 'AI/ML', count: 8, color: 'bg-green-900 text-green-400 border border-green-500' },
    { name: 'Web Dev', count: 12, color: 'bg-green-900 text-green-400 border border-green-500' },
    { name: 'Data Science', count: 6, color: 'bg-green-900 text-green-400 border border-green-500' },
    { name: 'Design', count: 4, color: 'bg-green-900 text-green-400 border border-green-500' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r-2 border-green-500 z-30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-green-500 font-mono">LearnAI</h2>
            <p className="text-sm text-green-400 font-mono">Terminal Mode</p>
          </div>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeItem === item.id ? "default" : "ghost"}
              className={`w-full justify-start font-mono ${
                activeItem === item.id 
                  ? "bg-green-600 text-black hover:bg-green-700 border border-green-500" 
                  : "text-green-400 hover:text-green-300 hover:bg-gray-800 border border-transparent hover:border-green-500"
              }`}
              onClick={() => setActiveItem(item.id)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="border-t-2 border-green-500 pt-6">
          <h3 className="text-sm font-semibold text-green-500 mb-4 flex items-center font-mono">
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 cursor-pointer border border-transparent hover:border-green-500"
              >
                <span className="text-sm text-green-400 font-mono">{category.name}</span>
                <Badge className={`text-xs font-mono ${category.color}`}>
                  {category.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-green-400 hover:text-green-300 hover:bg-gray-800 font-mono">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>
      </div>
    </aside>
  );
};

export { Sidebar };
