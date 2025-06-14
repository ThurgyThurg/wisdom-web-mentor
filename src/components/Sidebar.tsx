
import { useState } from 'react';
import { Home, BookOpen, Brain, Upload, BarChart3, Settings, FileText, Link, Tag } from 'lucide-react';
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
  ];

  const categories = [
    { name: 'AI/ML', count: 8, color: 'bg-blue-100 text-blue-800' },
    { name: 'Web Dev', count: 12, color: 'bg-green-100 text-green-800' },
    { name: 'Data Science', count: 6, color: 'bg-purple-100 text-purple-800' },
    { name: 'Design', count: 4, color: 'bg-pink-100 text-pink-800' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">LearnAI</h2>
            <p className="text-sm text-gray-500">Smart Learning</p>
          </div>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeItem === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeItem === item.id 
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => setActiveItem(item.id)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <span className="text-sm text-gray-700">{category.name}</span>
                <Badge className={`text-xs ${category.color}`}>
                  {category.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>
      </div>
    </aside>
  );
};

export { Sidebar };
