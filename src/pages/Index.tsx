
import { useState } from 'react';
import { Upload, MessageCircle, BookOpen, Brain, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AIChatInterface } from '@/components/AIChatInterface';
import { ResourceUpload } from '@/components/ResourceUpload';
import { Sidebar } from '@/components/Sidebar';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    { label: "Total Resources", value: "24", icon: BookOpen, color: "text-blue-600" },
    { label: "Study Hours", value: "142", icon: Brain, color: "text-emerald-600" },
    { label: "Completed", value: "8", icon: BookOpen, color: "text-purple-600" },
    { label: "AI Insights", value: "31", icon: Brain, color: "text-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
                <p className="text-gray-600">Manage your learning resources with AI assistance</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsChatOpen(true)}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Learning Resources</CardTitle>
                    <CardDescription>Organize and track your learning materials</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                            <CardDescription className="mt-1">{resource.category}</CardDescription>
                          </div>
                          <Badge variant={resource.type === 'PDF' ? 'default' : 'secondary'}>
                            {resource.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {resource.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{resource.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${resource.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500">
                            Added on {new Date(resource.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;
