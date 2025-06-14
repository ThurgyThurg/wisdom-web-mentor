
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon, CheckSquare, Square, Trash2, Edit3, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import InteractiveTask from '@/components/InteractiveTask';
import { format } from 'date-fns';

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

type PriorityType = 'low' | 'medium' | 'high' | 'urgent';

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
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: PriorityType;
    due_date: Date | undefined;
    parent_task_id: string;
  }>({
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

  const renderTask = (task: Task, level = 0) => {
    const interactiveTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === 'completed',
      priority: task.priority,
      due_date: task.due_date
    };

    return (
      <div key={task.id} className={`${level > 0 ? 'ml-6 mt-2' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <InteractiveTask
              task={interactiveTask}
              onToggle={handleToggleTask}
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(task)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTask(task.id)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2">
            {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const TaskForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-green-300 font-mono">
          Task Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title..."
          className="bg-black border-green-500 text-green-400 font-mono"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-green-300 font-mono">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the task..."
          className="bg-black border-green-500 text-green-400 font-mono"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-green-300 font-mono">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: PriorityType) => 
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-green-300 font-mono">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-mono bg-black border-green-500 text-green-400"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

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
            <TaskForm />
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
      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono flex items-center gap-2">
            <Filter className="w-5 h-5" />
            FILTERS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-green-300 font-mono">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-green-300 font-mono">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            YOUR TASKS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Square className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-green-300 font-mono">
                {tasks.length === 0 ? "No tasks created yet." : "No tasks match your filters."}
              </p>
              <p className="text-green-600 font-mono text-sm mt-2">
                {tasks.length === 0 ? "Create your first task to get started!" : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => renderTask(task))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="bg-gray-900 border-green-500">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono">EDIT TASK</DialogTitle>
          </DialogHeader>
          <TaskForm />
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
