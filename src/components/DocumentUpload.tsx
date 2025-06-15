
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedDocument {
  id: string;
  title: string;
  file_path: string;
  metadata: any; // Using any to match Supabase Json type
  ai_summary?: string;
  created_at: string;
}

const DocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [title, setTitle] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('learning_resources')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'document')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload PDF, TXT, or DOCX files only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Simple upload without onUploadProgress since it's not supported
      const { error: uploadError } = await supabase.storage
        .from('learning_resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Create database entry
      const { data: resource, error: dbError } = await supabase
        .from('learning_resources')
        .insert({
          user_id: user.id,
          title: title || file.name,
          type: 'Document', // FIX: Was 'document', causing a check constraint violation.
          file_path: filePath,
          metadata: {
            file_type: file.type,
            file_size: file.size,
            original_name: file.name
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(75);

      // Process document for AI understanding
      setProcessing(true);
      const { data: processResult, error: processError } = await supabase.functions.invoke('process-document', {
        body: { resourceId: resource.id }
      });

      if (processError) {
        console.error('Processing error:', processError);
        const description = processError?.context?.message || "Document uploaded but AI processing failed. You can try processing it again later.";
        toast({
          title: "Upload successful, processing failed",
          description: description,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Document uploaded successfully!",
          description: `${processResult.chunksCreated} knowledge chunks created for AI understanding.`,
        });
      }

      setUploadProgress(100);
      await loadDocuments();
      setTitle('');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (doc: UploadedDocument) => {
    if (!user) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('learning_resources')
        .remove([doc.file_path]);

      // Delete from database (this will cascade delete embeddings)
      const { error } = await supabase
        .from('learning_resources')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "Document deleted",
        description: "Document and its AI knowledge have been removed.",
      });

      await loadDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('text')) return '📝';
    if (fileType?.includes('word')) return '📃';
    return '📄';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono flex items-center gap-2">
            <Upload className="w-5 h-5" />
            UPLOAD DOCUMENTS TO YOUR SECOND BRAIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-green-300 font-mono">
              Document Title (optional)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a custom title for your document..."
              className="bg-black border-green-500 text-green-400 font-mono"
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-green-300 font-mono">
              Choose File (PDF, TXT, DOCX - Max 10MB)
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileUpload}
              className="bg-black border-green-500 text-green-400 font-mono file:bg-green-900 file:text-green-400 file:border-0"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                {processing ? (
                  <>
                    <AlertCircle className="w-4 h-4 animate-spin" />
                    Processing document for AI understanding...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Uploading document...
                  </>
                )}
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 font-mono flex items-center gap-2">
            <FileText className="w-5 h-5" />
            YOUR KNOWLEDGE BASE ({documents.length} documents)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-green-300 font-mono">No documents uploaded yet.</p>
              <p className="text-green-600 font-mono text-sm mt-2">
                Upload your first document to start building your AI knowledge base.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-black border border-green-500/30 rounded"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">
                      {getFileTypeIcon(doc.metadata?.file_type || '')}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-green-400 font-mono font-semibold">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className="bg-blue-600 text-white font-mono text-xs">
                          {doc.metadata?.file_type?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        {doc.metadata?.file_size && (
                          <span className="text-green-600 font-mono text-xs">
                            {formatFileSize(doc.metadata.file_size)}
                          </span>
                        )}
                        <span className="text-green-600 font-mono text-xs">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.ai_summary && (
                        <p className="text-green-300 font-mono text-sm mt-2 line-clamp-2">
                          {doc.ai_summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDocument(doc)}
                      className="font-mono"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
