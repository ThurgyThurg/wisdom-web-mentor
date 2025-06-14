import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Plus, Play, Pause, RotateCcw, Bot, User, Calendar, Target } from 'lucide-react';
import TerminalHeader from '@/components/TerminalHeader';
import InteractiveLearningPlan from '@/components/InteractiveLearningPlan';

interface LearningPlan {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number | null;
  plan_data: any[];
  status: 'active' | 'completed' | 'paused';
  progress: number;
  agent_generated: boolean;
  created_at: string;
  updated_at: string;
}

const LearningPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LearningPlan | null>(null);
  
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'beginner' as const,
    estimated_duration: ''
  });

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('learning_plans')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning plans:', error);
      return;
    }

    setPlans((data as LearningPlan[]) || []);
  };

  const handleCreatePlan = async () => {
    if (!user || !newPlan.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('learning_plans')
        .insert({
          user_id: user.id,
          title: newPlan.title,
          description: newPlan.description || null,
          subject: newPlan.subject,
          difficulty_level: newPlan.difficulty_level,
          estimated_duration: newPlan.estimated_duration ? parseInt(newPlan.estimated_duration) : null,
          plan_data: [],
          agent_generated: false
        });

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "Learning plan created successfully",
      });

      setNewPlan({ title: '', description: '', subject: '', difficulty_level: 'beginner', estimated_duration: '' });
      setIsCreating(false);
      fetchPlans();
    } catch (error) {
      console.error('Error creating learning plan:', error);
      toast({
        title: "ERROR",
        description: "Failed to create learning plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    const { error } = await supabase
      .from('learning_plans')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating plan status:', error);
      toast({
        title: "ERROR",
        description: "Failed to update plan status",
        variant: "destructive",
      });
    } else {
      fetchPlans();
    }
  };

  const handleProgressUpdate = async (planId: string, newProgress: number) => {
    const { error } = await supabase
      .from('learning_plans')
      .update({ 
        progress: newProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "ERROR",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } else {
      fetchPlans();
      if (newProgress === 100) {
        toast({
          title: "CONGRATULATIONS! 🎉",
          description: "Learning plan completed!",
        });
      }
    }
  };

  const handleModuleToggle = async (planId: string, moduleId: string, completed: boolean) => {
    // Update the plan_data in the database
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updatedModules = plan.plan_data.map(module => 
      module.id === moduleId ? { ...module, completed } : module
    );

    const { error } = await supabase
      .from('learning_plans')
      .update({ 
        plan_data: updatedModules,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating module:', error);
      toast({
        title: "ERROR",
        description: "Failed to update module",
        variant: "destructive",
      });
    } else {
      fetchPlans();
      if (completed) {
        toast({
          title: "MODULE COMPLETED! ✅",
          description: "Great progress!",
        });
      }
    }
  };

  const generateAIPlan = async (subject: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-plan', {
        body: { subject, difficulty: newPlan.difficulty_level }
      });

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "AI learning plan generated successfully",
      });

      fetchPlans();
    } catch (error) {
      console.error('Error generating AI plan:', error);
      toast({
        title: "ERROR",
        description: "Failed to generate AI learning plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced': return 'bg-red-600 text-white';
      case 'intermediate': return 'bg-orange-600 text-white';
      case 'beginner': return 'bg-green-600 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-black';
      case 'active': return 'bg-blue-600 text-white';
      case 'paused': return 'bg-yellow-600 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Transform plan data to include IDs for modules if they don't have them
  const transformPlanData = (plan: LearningPlan) => {
    const modules = plan.plan_data.map((module, index) => ({
      ...module,
      id: module.id || `${plan.id}-module-${index}`,
      completed: module.completed || false
    }));

    return {
      ...plan,
      modules
    };
  };

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-green-400 font-mono">INTERACTIVE LEARNING</h1>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-green-600 hover:bg-green-700 text-black font-mono"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW PLAN
              </Button>
              <Button
                onClick={() => generateAIPlan(newPlan.subject || 'General Programming')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
              >
                <Bot className="w-4 h-4 mr-2" />
                AI PLAN
              </Button>
            </div>
          </div>

          {/* Create Plan Modal */}
          {isCreating && (
            <Card className="bg-gray-900 border-green-500 mb-6">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">CREATE LEARNING PLAN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">TITLE</Label>
                    <Input
                      value={newPlan.title}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Plan title..."
                      className="bg-black border-green-500 text-green-400 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">SUBJECT</Label>
                    <Input
                      value={newPlan.subject}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., React, Python, Machine Learning"
                      className="bg-black border-green-500 text-green-400 font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">DIFFICULTY LEVEL</Label>
                    <Select value={newPlan.difficulty_level} onValueChange={(value: any) => setNewPlan(prev => ({ ...prev, difficulty_level: value }))}>
                      <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-green-500">
                        <SelectItem value="beginner">BEGINNER</SelectItem>
                        <SelectItem value="intermediate">INTERMEDIATE</SelectItem>
                        <SelectItem value="advanced">ADVANCED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">ESTIMATED DURATION (DAYS)</Label>
                    <Input
                      type="number"
                      value={newPlan.estimated_duration}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, estimated_duration: e.target.value }))}
                      placeholder="30"
                      className="bg-black border-green-500 text-green-400 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">DESCRIPTION</Label>
                  <Textarea
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Plan description..."
                    rows={3}
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreatePlan}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-black font-mono"
                  >
                    {loading ? 'CREATING...' : 'CREATE PLAN'}
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

          {/* Interactive Learning Plans */}
          <div className="space-y-6">
            {plans.map((plan) => (
              <InteractiveLearningPlan
                key={plan.id}
                plan={transformPlanData(plan)}
                onModuleToggle={handleModuleToggle}
                onProgressUpdate={handleProgressUpdate}
              />
            ))}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-green-600 font-mono text-lg">
                NO LEARNING PLANS YET. CREATE YOUR FIRST PLAN!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPlans;
