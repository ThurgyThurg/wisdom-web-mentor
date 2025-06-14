
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TaskForm, { TaskFormData, PriorityType } from './task/TaskForm';
import TaskFilters from './task/TaskFilters';
import TaskList from './task/TaskList';
import { Task } from './task/TaskItem';

const TaskManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: undefined,
    parent_task_id: ''
  });

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filterStatus, filterPriority]);

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } else {
      // Organize tasks with subtasks and ensure proper typing
      const typedTasks = (data || []).map(task => ({
        ...task,
        status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent'
      }));
      const organizedTasks = organizeTasks(typedTasks);
      setTasks(organizedTasks);
    }
    setLoading(false);
  };

  const organizeTasks = (taskList: Task[]): Task[] => {
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    // First pass: create task map
    taskList.forEach(task => {
      taskMap.set(task.id, { ...task, subtasks: [] });
    });

    // Second pass: organize hierarchy
    taskList.forEach(task => {
      const taskWithSubtasks = taskMap.get(task.id)!;
      if (task.parent_task_id) {
        const parent = taskMap.get(task.parent_task_id);
        if (parent) {
          parent.subtasks?.push(taskWithSubtasks);
        }
      } else {
        rootTasks.push(taskWithSubtasks);
      }
    });

    return rootTasks;
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!user || !formData.title.trim()) return;

    const taskData = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      parent_task_id: formData.parent_task_id || null,
      status: 'pending' as const
    };

    const { error } = await supabase
      .from('tasks')
      .insert(taskData);

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      resetForm();
      setIsCreateDialogOpen(false);
      loadTasks();
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return;

    const updateData = {
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', editingTask.id);

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setEditingTask(null);
      resetForm();
      loadTasks();
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const status = completed ? 'completed' : 'pending';
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error toggling task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      loadTasks();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: undefined,
      parent_task_id: ''
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      parent_task_id: task.parent_task_id || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-green-400 font-mono">LOADING TASKS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400 font-mono">
          TASK MANAGER ({tasks.length} tasks)
        </h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-mono">
              <Plus className="w-4 h-4 mr-2" />
              CREATE TASK
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-green-500">
            <DialogHeader>
              <DialogTitle className="text-green-400 font-mono">CREATE NEW TASK</DialogTitle>
            </DialogHeader>
            <TaskForm formData={formData} setFormData={setFormData} />
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateTask}
                className="bg-green-600 hover:bg-green-700 text-black font-mono"
                disabled={!formData.title.trim()}
              >
                CREATE
              </Button>
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
              >
                CANCEL
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <TaskFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
      />

      {/* Tasks List */}
      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggleTask}
        onEdit={openEditDialog}
        onDelete={handleDeleteTask}
        totalTasks={tasks.length}
      />

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="bg-gray-900 border-green-500">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono">EDIT TASK</DialogTitle>
          </DialogHeader>
          <TaskForm formData={formData} setFormData={setFormData} />
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpdateTask}
              className="bg-green-600 hover:bg-green-700 text-black font-mono"
              disabled={!formData.title.trim()}
            >
              UPDATE
            </Button>
            <Button
              onClick={() => {
                setEditingTask(null);
                resetForm();
              }}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
            >
              CANCEL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManager;
