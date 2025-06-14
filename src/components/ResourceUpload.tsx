
import { useState, useCallback } from 'react';
import { X, Upload, FileText, Link, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResourceUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResourceUpload = ({ isOpen, onClose }: ResourceUploadProps) => {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [url, setUrl] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload logic here
      console.log(e.dataTransfer.files[0]);
    }
  }, []);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ uploadType, title, description, category, tags, url });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Add Learning Resource</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Type Selection */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={uploadType === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadType('file')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={uploadType === 'link' ? 'default' : 'outline'}
                onClick={() => setUploadType('link')}
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>

            {/* File Upload Area */}
            {uploadType === 'file' && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOCX, TXT files up to 10MB
                  </p>
                  <Button type="button" variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </div>
            )}

            {/* URL Input */}
            {uploadType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="url">Resource URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/course"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter resource title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the resource..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-ml">AI/Machine Learning</SelectItem>
                  <SelectItem value="web-dev">Web Development</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Add Resource
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { ResourceUpload };
