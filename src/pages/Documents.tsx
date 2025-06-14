
import React from 'react';
import TerminalHeader from '@/components/TerminalHeader';
import DocumentUpload from '@/components/DocumentUpload';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Documents = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-400 font-mono mb-4">
              [DOCUMENT_KNOWLEDGE_BASE]
            </h1>
            <p className="text-green-300 font-mono text-lg">
              Upload your documents to create a personalized AI knowledge base. 
              Your agents will be able to read and understand your materials.
            </p>
          </div>
          <DocumentUpload />
        </div>
      </div>
    </div>
  );
};

export default Documents;
