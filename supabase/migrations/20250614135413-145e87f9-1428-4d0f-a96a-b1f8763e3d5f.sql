
-- Create a public bucket for learning resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning_resources', 'learning_resources', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy to allow users to upload files to a folder named with their user_id
CREATE POLICY "Allow authenticated uploads to user folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'learning_resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policy to allow users to view their own files
CREATE POLICY "Allow authenticated read access to user folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'learning_resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policy to allow users to update their own files
CREATE POLICY "Allow authenticated updates to user folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'learning_resources' AND auth.uid()::text = (storage.foldername(name))[1]);
  
-- RLS policy to allow users to delete their own files
CREATE POLICY "Allow authenticated deletes from user folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'learning_resources' AND auth.uid()::text = (storage.foldername(name))[1]);
