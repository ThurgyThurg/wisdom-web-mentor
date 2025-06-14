
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

type PriorityType = 'low' | 'medium' | 'high' | 'urgent';

interface TaskFormData {
  title: string;
  description: string;
  priority: PriorityType;
  due_date: Date | undefined;
  parent_task_id: string;
}

interface TaskFormProps {
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
}

const TaskForm: React.FC<TaskFormProps> = ({ formData, setFormData }) => {
  return (
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
};

export default TaskForm;
export type { TaskFormData, PriorityType };
