import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Send, Loader2, FolderUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastAction } from './ui/toast';
import { ResourceUpload } from './ResourceUpload';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
}

const agentOptions = [
  { value: 'general_assistant', label: 'General Assistant' },
  { value: 'research', label: 'Research Assistant' },
  { value: 'task_breakdown', label: 'Task Breakdown Specialist' },
  { value: 'learning_plan', label: 'Learning Plan Creator' },
  { value: 'note_taker', label: 'Note Taker' },
];

const AgentChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-processor', {
        body: {
          message: input,
          userId: user.id,
          conversationId,
        },
      });

      if (error) throw error;
      
      const { response, actionTaken, conversationId: newConversationId, agentType } = data;
      const assistantMessage: Message = { role: 'assistant', content: response, agentType };
      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(newConversationId);

      if (actionTaken === 'note_created') {
        toast({
          title: "Note Created!",
          description: "The AI has saved a new note for you.",
          action: <ToastAction altText="View Notes" onClick={() => navigate('/notes')}>View Notes</ToastAction>,
        });
      } else if (actionTaken === 'tasks_created') {
        toast({
          title: "Tasks Created!",
          description: "The AI has created a new task plan.",
          action: <ToastAction altText="View Tasks" onClick={() => navigate('/tasks')}>View Tasks</ToastAction>,
        });
      }

    } catch (err: any) {
      console.error("Error calling edge function:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      const errorMessage = err?.context?.message || err.message || 'An error occurred.';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
      toast({
        title: "ERROR",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono">AGENTIC AI SYSTEM</CardTitle>
          <CardDescription className="text-green-600 font-mono">
            Please log in to access your AI assistants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/auth">
            <Button className="bg-green-600 hover:bg-green-700 text-black font-mono">
              LOG IN
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full h-[80vh] flex flex-col bg-gray-900 border-green-500 font-mono">
        <CardHeader className="border-b border-green-700 flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Bot /> AGENTIC AI SYSTEM
            </CardTitle>
            <CardDescription className="text-green-600">Your intelligent assistant is ready. Start a conversation.</CardDescription>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)} variant="outline" className="font-mono bg-black border-green-500 text-green-400 hover:bg-green-900 hover:text-green-300">
            <FolderUp className="w-4 h-4 mr-2" />
            ADD KNOWLEDGE
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <>
                      <Bot className="w-6 h-6 text-blue-400 flex-shrink-0" />
                      <div className="p-3 rounded-lg max-w-lg bg-gray-800 text-green-400">
                        {message.agentType && (
                          <div className="text-xs text-blue-300 font-mono mb-2 border-b border-blue-900 pb-1 flex items-center gap-2">
                            <span>Handled by:</span>
                            <span className="font-bold">{agentOptions.find(o => o.value === message.agentType)?.label || message.agentType}</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </>
                  )}
                   {message.role === 'user' && (
                    <>
                      <div className={`p-3 rounded-lg max-w-lg bg-green-900 text-green-300`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <User className="w-6 h-6 text-green-400 flex-shrink-0" />
                    </>
                   )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Bot className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  <div className="p-3 rounded-lg bg-gray-800 text-green-400 flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t border-green-700 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message your AI agent..."
                className="flex-1 bg-black border-green-500 text-green-400 font-mono"
                disabled={isLoading}
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-black" disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      <ResourceUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          toast({
            title: "Knowledge base updated!",
            description: "The AI is now processing your new document.",
          });
        }}
      />
    </>
  );
};

export default AgentChat;
