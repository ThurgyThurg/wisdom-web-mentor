
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StickyNote, Plus, Edit3, Trash2, Bot, User, Search, Tag } from 'lucide-react';
import TerminalHeader from '@/components/TerminalHeader';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  agent_generated: boolean;
  source_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    newTag: ''
  });

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    setNotes(data || []);
  };

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags,
          agent_generated: false
        });

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "Note created successfully",
      });

      setNewNote({ title: '', content: '', tags: [], newTag: '' });
      setIsCreating(false);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "ERROR",
        description: "Failed to create note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editingNote.title,
          content: editingNote.content,
          tags: editingNote.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "Note updated successfully",
      });

      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "ERROR",
        description: "Failed to update note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "ERROR",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } else {
      toast({
        title: "SUCCESS",
        description: "Note deleted successfully",
      });
      fetchNotes();
    }
  };

  const addTag = (noteData: any, setNoteData: any) => {
    if (noteData.newTag.trim() && !noteData.tags.includes(noteData.newTag.trim())) {
      setNoteData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string, noteData: any, setNoteData: any) => {
    setNoteData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-green-400 font-mono">KNOWLEDGE BASE</h1>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700 text-black font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW NOTE
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-green-500" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-green-500 text-green-400 font-mono"
              />
            </div>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-2 bg-black border border-green-500 text-green-400 font-mono rounded"
            >
              <option value="">ALL TAGS</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Create Note Modal */}
          {isCreating && (
            <Card className="bg-gray-900 border-green-500 mb-6">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">CREATE NEW NOTE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">TITLE</Label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">CONTENT</Label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note..."
                    rows={6}
                    className="bg-black border-green-500 text-green-400 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">TAGS</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newNote.newTag}
                      onChange={(e) => setNewNote(prev => ({ ...prev, newTag: e.target.value }))}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newNote, setNewNote))}
                      className="bg-black border-green-500 text-green-400 font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() => addTag(newNote, setNewNote)}
                      className="bg-green-600 hover:bg-green-700 text-black font-mono"
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {newNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newNote.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer bg-green-600 text-black font-mono"
                          onClick={() => removeTag(tag, newNote, setNewNote)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateNote}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-black font-mono"
                  >
                    {loading ? 'CREATING...' : 'CREATE NOTE'}
                  </Button>
                  <Button
                    onClick={() => setIsCreating(false)}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
                  >
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="bg-gray-900 border-green-500 hover:border-green-400 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {note.agent_generated ? (
                        <Bot className="w-4 h-4 text-blue-400" />
                      ) : (
                        <User className="w-4 h-4 text-green-400" />
                      )}
                      <CardTitle className="text-green-400 font-mono text-lg">{note.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingNote(note)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-300 font-mono text-sm mb-3 line-clamp-3">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-600 text-black font-mono text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <CardDescription className="text-green-600 font-mono text-xs">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <StickyNote className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-green-600 font-mono text-lg">
                {notes.length === 0 ? 'NO NOTES YET. CREATE YOUR FIRST NOTE!' : 'NO NOTES MATCH YOUR SEARCH.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-gray-900 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-400 font-mono">EDIT NOTE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">TITLE</Label>
                <Input
                  value={editingNote.title}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">CONTENT</Label>
                <Textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={8}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleUpdateNote}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-black font-mono"
                >
                  {loading ? 'UPDATING...' : 'UPDATE NOTE'}
                </Button>
                <Button
                  onClick={() => setEditingNote(null)}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
                >
                  CANCEL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Notes;
