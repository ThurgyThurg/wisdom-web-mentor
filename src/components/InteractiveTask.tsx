
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface InteractiveTaskProps {
  task: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
  };
  onToggle: (taskId: string, completed: boolean) => void;
}

const InteractiveTask = ({ task, onToggle }: InteractiveTaskProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className={`p-3 border rounded-lg transition-all ${
      task.completed 
        ? 'bg-green-900/20 border-green-500/30' 
        : 'bg-gray-900 border-green-500'
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-mono text-green-400 ${
              task.completed ? 'line-through opacity-60' : ''
            }`}>
              {task.title}
            </h4>
            {task.priority && (
              <Badge className={`${getPriorityColor(task.priority)} font-mono text-xs`}>
                {task.priority.toUpperCase()}
              </Badge>
            )}
          </div>
          {task.description && (
            <p className={`text-green-300 font-mono text-sm ${
              task.completed ? 'line-through opacity-60' : ''
            }`}>
              {task.description}
            </p>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1 text-green-600 font-mono text-xs mt-2">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveTask;
