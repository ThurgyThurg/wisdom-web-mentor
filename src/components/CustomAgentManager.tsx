
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bot, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface CustomAgent {
  id: string;
  name: string;
  type: string;
  system_prompt: string;
  is_active: boolean;
  config: any;
  created_at: string;
}

const agentTypes = [
  { value: 'research', label: 'Research Assistant' },
  { value: 'task_breakdown', label: 'Task Breakdown Specialist' },
  { value: 'learning_plan', label: 'Learning Plan Creator' },
  { value: 'note_taker', label: 'Note Taker' },
  { value: 'general_assistant', label: 'General Assistant' },
  { value: 'code_review', label: 'Code Review Assistant' },
  { value: 'socratic_questioning', label: 'Socratic Questioning' },
  { value: 'creative_writing', label: 'Creative Writing Assistant' },
  { value: 'data_analysis', label: 'Data Analysis Helper' },
  { value: 'custom', label: 'Custom Agent' }
];

const CustomAgentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    system_prompt: '',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      fetchAgents();
    }
  }, [user]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch agents: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const agentData = {
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        system_prompt: formData.system_prompt,
        is_active: formData.is_active
      };

      if (editingAgent) {
        const { error } = await supabase
          .from('ai_agents')
          .update(agentData)
          .eq('id', editingAgent);
        
        if (error) throw error;
        toast({ title: "Success", description: "Agent updated successfully!" });
      } else {
        const { error } = await supabase
          .from('ai_agents')
          .insert(agentData);
        
        if (error) throw error;
        toast({ title: "Success", description: "Agent created successfully!" });
      }

      resetForm();
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save agent: " + error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);
      
      if (error) throw error;
      toast({ title: "Success", description: "Agent deleted successfully!" });
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete agent: " + error.message,
        variant: "destructive",
      });
    }
  };

  const editAgent = (agent: CustomAgent) => {
    setFormData({
      name: agent.name,
      type: agent.type,
      system_prompt: agent.system_prompt,
      is_active: agent.is_active
    });
    setEditingAgent(agent.id);
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      system_prompt: '',
      is_active: true
    });
    setIsCreating(false);
    setEditingAgent(null);
  };

  const toggleAgentStatus = async (agentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ is_active: !isActive })
        .eq('id', agentId);
      
      if (error) throw error;
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update agent status: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono">CUSTOM AI AGENTS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-mono">Please log in to manage your custom AI agents.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-400 font-mono">CUSTOM AI AGENTS</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-green-600 hover:bg-green-700 text-black font-mono"
        >
          <Plus className="w-4 h-4 mr-2" />
          CREATE AGENT
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-gray-900 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-green-400 font-mono">
              {editingAgent ? 'EDIT AGENT' : 'CREATE NEW AGENT'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-green-400">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-green-400 font-mono">AGENT NAME</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Code Review Assistant"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-green-400 font-mono">AGENT TYPE</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-500">
                      {agentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_prompt" className="text-green-400 font-mono">SYSTEM PROMPT</Label>
                <Textarea
                  id="system_prompt"
                  placeholder="Define the agent's personality, expertise, and behavior..."
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  rows={6}
                  required
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm} className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono">
                  CANCEL
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-black font-mono">
                  <Save className="w-4 h-4 mr-2" />
                  {editingAgent ? 'UPDATE' : 'CREATE'} AGENT
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-gray-900 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-green-400 font-mono">{agent.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={agent.is_active ? "default" : "secondary"}
                  className={`font-mono ${agent.is_active ? 'bg-green-600 text-black' : 'bg-gray-600 text-gray-300'}`}
                >
                  {agent.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-green-600 font-mono">TYPE:</p>
                  <p className="text-sm text-green-400 font-mono">
                    {agentTypes.find(t => t.value === agent.type)?.label || agent.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-mono">SYSTEM PROMPT:</p>
                  <p className="text-sm text-green-400 font-mono line-clamp-3">
                    {agent.system_prompt}
                  </p>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                    className="font-mono border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-black"
                  >
                    {agent.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editAgent(agent)}
                      className="font-mono border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAgent(agent.id)}
                      className="font-mono border-red-500 text-red-400 hover:bg-red-500 hover:text-black"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && !isCreating && (
        <Card className="bg-gray-900 border-green-500">
          <CardContent className="text-center py-8">
            <Bot className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-400 font-mono mb-2">NO CUSTOM AGENTS YET</h3>
            <p className="text-green-600 font-mono mb-4">Create your first custom AI agent to get started.</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700 text-black font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE YOUR FIRST AGENT
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomAgentManager;
