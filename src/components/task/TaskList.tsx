
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Square } from 'lucide-react';
import TaskItem, { Task } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  totalTasks: number;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onToggle, 
  onEdit, 
  onDelete, 
  totalTasks 
}) => {
  return (
    <Card className="bg-gray-900 border-green-500">
      <CardHeader>
        <CardTitle className="text-green-400 font-mono flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          YOUR TASKS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Square className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-green-300 font-mono">
              {totalTasks === 0 ? "No tasks created yet." : "No tasks match your filters."}
            </p>
            <p className="text-green-600 font-mono text-sm mt-2">
              {totalTasks === 0 ? "Create your first task to get started!" : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
