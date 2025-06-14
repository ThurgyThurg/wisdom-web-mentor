
import { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, User, Sparkles, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AIChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatInterface = ({ isOpen, onClose }: AIChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI learning assistant. I can help you with resource analysis, study planning, content summaries, and personalized learning recommendations. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: generateAIResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string) => {
    const responses = [
      "Based on your learning resources, I recommend focusing on the fundamentals first. Would you like me to create a personalized study plan?",
      "I've analyzed your uploaded materials and found some knowledge gaps in advanced topics. Here are some complementary resources I suggest...",
      "Your learning progress shows strong consistency! I can help optimize your study schedule for better retention.",
      "I notice you're working on machine learning. Let me summarize the key concepts from your recent uploads and suggest practice exercises."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickActions = [
    { icon: FileText, label: "Summarize Resource", action: "summarize" },
    { icon: Lightbulb, label: "Study Tips", action: "tips" },
    { icon: Brain, label: "Learning Path", action: "path" },
    { icon: Sparkles, label: "Quiz Me", action: "quiz" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Learning Assistant</h3>
              <p className="text-sm text-gray-600">Powered by advanced AI</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.type === 'ai' && (
                    <Brain className="w-4 h-4 mt-0.5 text-emerald-600" />
                  )}
                  {msg.type === 'user' && (
                    <User className="w-4 h-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
          <div className="flex gap-2 mb-3">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setMessage(action.label)}
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your learning..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { AIChatInterface };
