
import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, CheckCircle, Clock, Target } from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  estimatedHours?: number;
  completed: boolean;
  resources?: string[];
}

interface InteractiveLearningPlanProps {
  plan: {
    id: string;
    title: string;
    description?: string;
    modules: LearningModule[];
    progress: number;
  };
  onModuleToggle: (planId: string, moduleId: string, completed: boolean) => void;
  onProgressUpdate?: (planId: string, newProgress: number) => void;
}

const InteractiveLearningPlan = ({ 
  plan, 
  onModuleToggle, 
  onProgressUpdate 
}: InteractiveLearningPlanProps) => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const completedModules = plan.modules.filter(m => m.completed).length;
  const totalModules = plan.modules.length;
  const calculatedProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const handleModuleToggle = (moduleId: string, completed: boolean) => {
    onModuleToggle(plan.id, moduleId, completed);
    
    // Auto-update progress based on completed modules
    if (onProgressUpdate) {
      const newCompletedCount = plan.modules.filter(m => 
        m.id === moduleId ? completed : m.completed
      ).length;
      const newProgress = Math.round((newCompletedCount / totalModules) * 100);
      onProgressUpdate(plan.id, newProgress);
    }
  };

  const totalEstimatedHours = plan.modules.reduce((sum, module) => 
    sum + (module.estimatedHours || 0), 0
  );

  return (
    <Card className="bg-gray-900 border-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-400 font-mono">{plan.title}</CardTitle>
            {plan.description && (
              <p className="text-green-300 font-mono text-sm mt-1">{plan.description}</p>
            )}
          </div>
          <Badge className="bg-blue-600 text-white font-mono">
            {completedModules}/{totalModules} COMPLETE
          </Badge>
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between text-sm font-mono text-green-400">
            <span>PROGRESS</span>
            <span>{calculatedProgress}%</span>
          </div>
          <Progress value={calculatedProgress} className="h-3 bg-gray-700" />
        </div>

        {totalEstimatedHours > 0 && (
          <div className="flex items-center gap-2 text-green-600 font-mono text-sm mt-2">
            <Clock className="w-4 h-4" />
            <span>Estimated: {totalEstimatedHours} hours</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {plan.modules.map((module, index) => (
          <div key={module.id} className="space-y-2">
            <div className={`p-3 border rounded-lg transition-all cursor-pointer ${
              module.completed 
                ? 'bg-green-900/20 border-green-500/30' 
                : 'bg-black border-green-500/50 hover:border-green-500'
            }`}
            onClick={() => setExpandedModule(
              expandedModule === module.id ? null : module.id
            )}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={module.completed}
                  onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 font-mono text-sm">
                      MODULE {index + 1}
                    </span>
                    {module.completed && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <h4 className={`font-mono text-green-400 ${
                    module.completed ? 'line-through opacity-60' : ''
                  }`}>
                    {module.title}
                  </h4>
                  <p className={`text-green-300 font-mono text-sm mt-1 ${
                    module.completed ? 'line-through opacity-60' : ''
                  }`}>
                    {module.description}
                  </p>
                  {module.estimatedHours && (
                    <div className="flex items-center gap-1 text-green-600 font-mono text-xs mt-2">
                      <Target className="w-3 h-3" />
                      {module.estimatedHours} hours
                    </div>
                  )}
                </div>
              </div>
            </div>

            {expandedModule === module.id && module.resources && (
              <div className="ml-6 p-3 bg-gray-800 border border-green-500/30 rounded">
                <h5 className="text-green-400 font-mono text-sm mb-2">RESOURCES:</h5>
                <ul className="space-y-1">
                  {module.resources.map((resource, idx) => (
                    <li key={idx} className="text-green-300 font-mono text-sm">
                      • {resource}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {calculatedProgress === 100 && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-mono font-bold">
              CONGRATULATIONS! PLAN COMPLETED!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveLearningPlan;
