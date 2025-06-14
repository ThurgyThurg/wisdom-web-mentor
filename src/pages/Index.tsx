
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Upload, MessageCircle, BookOpen, Brain, Search, Plus, Filter, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AIChatInterface } from '@/components/AIChatInterface';
import { ResourceUpload } from '@/components/ResourceUpload';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import TerminalHeader from '@/components/TerminalHeader';
import N8nWebhookManager from '@/components/N8nWebhookManager';

const Index = () => {
  const { user, loading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono text-xl">INITIALIZING TERMINAL...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Mock data for resources
  const resources = [
    {
      id: 1,
      title: "Machine Learning Fundamentals",
      type: "PDF",
      category: "AI/ML",
      tags: ["python", "algorithms", "beginner"],
      uploadDate: "2024-06-10",
      progress: 65
    },
    {
      id: 2,
      title: "React Complete Course - Udemy",
      type: "Link",
      category: "Web Development",
      tags: ["react", "javascript", "frontend"],
      uploadDate: "2024-06-08",
      progress: 40
    },
    {
      id: 3,
      title: "Data Structures Deep Dive",
      type: "PDF",
      category: "Computer Science",
      tags: ["algorithms", "data-structures", "advanced"],
      uploadDate: "2024-06-05",
      progress: 85
    }
  ];

  const stats = [
    { label: "Total Resources", value: "24", icon: BookOpen, color: "text-green-500" },
    { label: "Study Hours", value: "142", icon: Brain, color: "text-green-400" },
    { label: "Completed", value: "8", icon: BookOpen, color: "text-green-300" },
    { label: "AI Insights", value: "31", icon: Brain, color: "text-green-600" }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64">
          <TerminalHeader />

          <div className="p-6 space-y-6">
            {/* Navigation Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setActiveView('dashboard')}
                variant={activeView === 'dashboard' ? 'default' : 'outline'}
                className={`font-mono ${
                  activeView === 'dashboard'
                    ? 'bg-green-600 text-black hover:bg-green-700'
                    : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black'
                }`}
              >
                DASHBOARD
              </Button>
              <Button
                onClick={() => setActiveView('webhooks')}
                variant={activeView === 'webhooks' ? 'default' : 'outline'}
                className={`font-mono ${
                  activeView === 'webhooks'
                    ? 'bg-green-600 text-black hover:bg-green-700'
                    : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black'
                }`}
              >
                <Webhook className="w-4 h-4 mr-2" />
                N8N WEBHOOKS
              </Button>
            </div>

            {activeView === 'webhooks' ? (
              <N8nWebhookManager />
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index} className="bg-gray-900 border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600 font-mono">{stat.label}</p>
                            <p className="text-3xl font-bold text-green-400 font-mono">{stat.value}</p>
                          </div>
                          <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-black font-mono"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ADD RESOURCE
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsChatOpen(true)}
                    className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI ASSISTANT
                  </Button>
                </div>

                {/* Search and Filter */}
                <Card className="bg-gray-900 border-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-green-400 font-mono">LEARNING RESOURCES</CardTitle>
                        <CardDescription className="text-green-600 font-mono">
                          Organize and track your learning materials
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono">
                        <Filter className="w-4 h-4 mr-2" />
                        FILTER
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                      <Input
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-black border-green-500 text-green-400 font-mono focus:border-green-400"
                      />
                    </div>

                    {/* Resources Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {resources.map((resource) => (
                        <Card key={resource.id} className="bg-black border-green-500 hover:shadow-md hover:shadow-green-500/20 transition-shadow duration-200 cursor-pointer">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg text-green-400 font-mono line-clamp-2">{resource.title}</CardTitle>
                                <CardDescription className="mt-1 text-green-600 font-mono">{resource.category}</CardDescription>
                              </div>
                              <Badge 
                                variant={resource.type === 'PDF' ? 'default' : 'secondary'}
                                className={`font-mono ${
                                  resource.type === 'PDF' 
                                    ? 'bg-green-600 text-black' 
                                    : 'bg-gray-600 text-green-400'
                                }`}
                              >
                                {resource.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {resource.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs border-green-500 text-green-400 font-mono">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-green-600 font-mono">Progress</span>
                                  <span className="font-medium text-green-400 font-mono">{resource.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 border border-green-500">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${resource.progress}%` }}
                                  />
                                </div>
                              </div>
                              
                              <p className="text-sm text-green-600 font-mono">
                                Added on {new Date(resource.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>

        {/* AI Chat Interface */}
        <AIChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        
        {/* Resource Upload Modal */}
        <ResourceUpload isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      </div>

      {/* Floating AI Chat Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        >
          <MessageCircle className="w-6 h-6 text-black" />
        </Button>
      )}
    </div>
  );
};

export default Index;
