import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, Edit3, Trash2, Bot, User, Calendar, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import TerminalHeader from '@/components/TerminalHeader';
import InteractiveTask from '@/components/InteractiveTask';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  agent_generated: boolean;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    parent_task_id: null as string | null
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    const tasksData: Task[] = (data as Task[]) || [];

    // Organize tasks with subtasks
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    tasksData.forEach(task => {
      taskMap.set(task.id, { ...task, subtasks: [] });
    });

    tasksData.forEach(task => {
      if (task.parent_task_id) {
        const parent = taskMap.get(task.parent_task_id);
        if (parent) {
          parent.subtasks!.push(taskMap.get(task.id)!);
        }
      } else {
        rootTasks.push(taskMap.get(task.id)!);
      }
    });

    setTasks(rootTasks);
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          parent_task_id: newTask.parent_task_id,
          agent_generated: false
        });

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "Task created successfully",
      });

      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', parent_task_id: null });
      setIsCreating(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "ERROR",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 'completed' : 'pending';
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "ERROR",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      fetchTasks();
      if (completed) {
        toast({
          title: "SUCCESS",
          description: "Task completed! 🎉",
        });
      }
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "ERROR",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      fetchTasks();
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
        title: "ERROR",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "SUCCESS",
        description: "Task deleted successfully",
      });
      fetchTasks();
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-black';
      case 'in_progress': return 'bg-blue-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const renderTask = (task: Task, level = 0) => (
    <div key={task.id} className={`${level > 0 ? 'ml-8 border-l-2 border-green-500 pl-4' : ''} mb-4`}>
      {/* Interactive Task Component */}
      <div className="mb-2">
        <InteractiveTask
          task={{
            id: task.id,
            title: task.title,
            description: task.description || undefined,
            completed: task.status === 'completed',
            priority: task.priority,
            due_date: task.due_date || undefined
          }}
          onToggle={handleTaskToggle}
        />
      </div>

      {/* Additional Task Controls */}
      <Card className="bg-gray-800 border-green-500/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {task.subtasks && task.subtasks.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleTaskExpansion(task.id)}
                  className="text-green-400"
                >
                  {expandedTasks.has(task.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              )}
              {task.agent_generated ? (
                <Bot className="w-4 h-4 text-blue-400" />
              ) : (
                <User className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                <SelectTrigger className="w-32 bg-black border-green-500 text-green-400 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-green-500">
                  <SelectItem value="pending">PENDING</SelectItem>
                  <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                  <SelectItem value="completed">COMPLETED</SelectItem>
                  <SelectItem value="cancelled">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <div className="flex items-center gap-4">
              <Badge className={`${getStatusColor(task.status)} font-mono text-xs`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="text-green-600 font-mono text-sm">
                  {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <div className="text-green-600 font-mono text-xs">
              {new Date(task.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {expandedTasks.has(task.id) && task.subtasks && task.subtasks.map(subtask => 
        renderTask(subtask, level + 1)
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-green-400 font-mono">INTERACTIVE TASKS</h1>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700 text-black font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW TASK
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-black border-green-500 text-green-400 font-mono">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-green-500">
                <SelectItem value="all">ALL STATUS</SelectItem>
                <SelectItem value="pending">PENDING</SelectItem>
                <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                <SelectItem value="completed">COMPLETED</SelectItem>
                <SelectItem value="cancelled">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48 bg-black border-green-500 text-green-400 font-mono">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-green-500">
                <SelectItem value="all">ALL PRIORITY</SelectItem>
                <SelectItem value="urgent">URGENT</SelectItem>
                <SelectItem value="high">HIGH</SelectItem>
                <SelectItem value="medium">MEDIUM</SelectItem>
                <SelectItem value="low">LOW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Task Modal */}
          {isCreating && (
            <Card className="bg-gray-900 border-green-500 mb-6">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">CREATE NEW TASK</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">TITLE</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Task title..."
                      className="bg-black border-green-500 text-green-400 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">PRIORITY</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-green-500">
                        <SelectItem value="low">LOW</SelectItem>
                        <SelectItem value="medium">MEDIUM</SelectItem>
                        <SelectItem value="high">HIGH</SelectItem>
                        <SelectItem value="urgent">URGENT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">DESCRIPTION</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description..."
                    rows={3}
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">DUE DATE (OPTIONAL)</Label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateTask}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-black font-mono"
                  >
                    {loading ? 'CREATING...' : 'CREATE TASK'}
                  </Button>
                  <Button
                    onClick={() => setIsCreating(false)}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map(task => renderTask(task))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-green-600 font-mono text-lg">
                {tasks.length === 0 ? 'NO TASKS YET. CREATE YOUR FIRST TASK!' : 'NO TASKS MATCH YOUR FILTERS.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
