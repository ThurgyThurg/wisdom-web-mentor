import { useState, useCallback } from 'react';
import { X, Upload, FileText, Link, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResourceUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

const ResourceUpload = ({ isOpen, onClose, onUploadComplete }: ResourceUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
      setFile(e.dataTransfer.files[0]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      let resourceData: any = {
        user_id: user.id,
        title,
        type: uploadType === 'file' ? (file?.type.includes('pdf') ? 'PDF' : 'Document') : 'Link',
        category,
        tags,
        metadata: { description }
      };

      if (uploadType === 'link') {
        resourceData.content_url = url;
      } else if (file) {
        const filePath = `${user.id}/${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('learning_resources')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Storage Error: ${uploadError.message}`);
        }

        resourceData.file_path = filePath;
        resourceData.metadata.file_size = file.size;
        resourceData.metadata.file_type = file.type;
      }

      const { data, error } = await supabase
        .from('learning_resources')
        .insert(resourceData)
        .select()
        .single();

      if (error) throw error;

      // If a file was uploaded, trigger embedding processing
      if (file && data) {
        const { error: embeddingError } = await supabase.functions.invoke('process-document', {
          body: { 
            resourceId: data.id,
          }
        });

        if (embeddingError) {
          console.error('Error processing document for embeddings:', embeddingError);
          toast({
            title: "Upload successful, but processing failed.",
            description: "Your document was saved, but the AI may not be able to use it. You can try re-uploading.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Resource uploaded and is being processed.",
      });

      onUploadComplete?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setTags([]);
    setUrl('');
    setFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-green-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-green-400 font-mono">ADD LEARNING RESOURCE</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-green-400 hover:text-green-300">
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
                className="flex-1 font-mono"
              >
                <FileText className="w-4 h-4 mr-2" />
                UPLOAD FILE
              </Button>
              <Button
                type="button"
                variant={uploadType === 'link' ? 'default' : 'outline'}
                onClick={() => setUploadType('link')}
                className="flex-1 font-mono"
              >
                <Link className="w-4 h-4 mr-2" />
                ADD LINK
              </Button>
            </div>

            {/* File Upload Area */}
            {uploadType === 'file' && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-green-500 hover:border-green-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  {file ? (
                    <p className="text-lg font-medium text-green-400 mb-2 font-mono">
                      {file.name}
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-green-400 mb-2 font-mono">
                      DROP FILES HERE OR CLICK TO BROWSE
                    </p>
                  )}
                  <p className="text-sm text-green-600 font-mono">
                    Supports PDF, DOCX, TXT files up to 10MB
                  </p>
                  <Button type="button" variant="outline" className="mt-4 font-mono border-green-500 text-green-400">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    CHOOSE FILES
                  </Button>
                </div>
              </div>
            )}

            {/* URL Input */}
            {uploadType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="url" className="text-green-400 font-mono">RESOURCE URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/course"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-green-400 font-mono">TITLE</Label>
              <Input
                id="title"
                placeholder="Enter resource title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-black border-green-500 text-green-400 font-mono"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-green-400 font-mono">DESCRIPTION (OPTIONAL)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the resource..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-black border-green-500 text-green-400 font-mono"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-green-400 font-mono">CATEGORY</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-green-500">
                  <SelectItem value="ai-ml">AI/MACHINE LEARNING</SelectItem>
                  <SelectItem value="web-dev">WEB DEVELOPMENT</SelectItem>
                  <SelectItem value="data-science">DATA SCIENCE</SelectItem>
                  <SelectItem value="design">DESIGN</SelectItem>
                  <SelectItem value="computer-science">COMPUTER SCIENCE</SelectItem>
                  <SelectItem value="business">BUSINESS</SelectItem>
                  <SelectItem value="other">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-green-400 font-mono">TAGS</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
                <Button type="button" onClick={addTag} size="sm" className="bg-green-600 hover:bg-green-700 text-black font-mono">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer bg-green-600 text-black font-mono" onClick={() => removeTag(tag)}>
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono">
                CANCEL
              </Button>
              <Button type="submit" disabled={uploading} className="flex-1 bg-green-600 hover:bg-green-700 text-black font-mono">
                {uploading ? 'UPLOADING...' : 'ADD RESOURCE'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { ResourceUpload };
