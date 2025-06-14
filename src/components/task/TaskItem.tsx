
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import InteractiveTask from '@/components/InteractiveTask';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

interface TaskItemProps {
  task: Task;
  level?: number;
  onToggle: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  level = 0, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  const interactiveTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === 'completed',
    priority: task.priority,
    due_date: task.due_date
  };

  return (
    <div className={`${level > 0 ? 'ml-6 mt-2' : 'mb-3'}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <InteractiveTask
            task={interactiveTask}
            onToggle={onToggle}
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2">
          {task.subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
export type { Task };
