
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, Trash2, Link, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface N8nWebhook {
  id: string;
  webhook_url: string;
  webhook_name: string;
  is_active: boolean;
  created_at: string;
}

const N8nWebhookManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<N8nWebhook[]>([]);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWebhooks();
    }
  }, [user]);

  const fetchWebhooks = async () => {
    const { data, error } = await supabase
      .from('n8n_webhooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch webhooks",
        variant: "destructive",
      });
    } else {
      setWebhooks(data || []);
    }
  };

  const addWebhook = async () => {
    if (!newWebhookName || !newWebhookUrl) return;

    setLoading(true);
    const { error } = await supabase
      .from('n8n_webhooks')
      .insert({
        user_id: user?.id,
        webhook_name: newWebhookName,
        webhook_url: newWebhookUrl,
        is_active: true,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add webhook",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Webhook added successfully",
      });
      setNewWebhookName('');
      setNewWebhookUrl('');
      setIsAddingWebhook(false);
      fetchWebhooks();
    }
    setLoading(false);
  };

  const deleteWebhook = async (id: string) => {
    const { error } = await supabase
      .from('n8n_webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
      fetchWebhooks();
    }
  };

  const toggleWebhook = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('n8n_webhooks')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    } else {
      fetchWebhooks();
    }
  };

  return (
    <Card className="bg-gray-900 border-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Webhook className="w-6 h-6 text-green-500" />
            <div>
              <CardTitle className="text-green-400 font-mono">N8N WEBHOOKS</CardTitle>
              <CardDescription className="text-green-600 font-mono text-sm">
                Manage your automation endpoints
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setIsAddingWebhook(true)}
            className="bg-green-600 hover:bg-green-700 text-black font-mono"
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD WEBHOOK
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingWebhook && (
          <div className="p-4 border border-green-500 rounded-lg bg-black space-y-4">
            <div className="space-y-2">
              <Label className="text-green-400 font-mono">Webhook Name</Label>
              <Input
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
                placeholder="Learning Resource Processor"
                className="bg-black border-green-500 text-green-400 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-green-400 font-mono">Webhook URL</Label>
              <Input
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="bg-black border-green-500 text-green-400 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addWebhook}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-black font-mono"
              >
                {loading ? 'ADDING...' : 'ADD'}
              </Button>
              <Button
                onClick={() => setIsAddingWebhook(false)}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between p-4 border border-green-500 rounded-lg bg-black"
            >
              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="text-green-400 font-mono font-semibold">
                    {webhook.webhook_name}
                  </h4>
                  <p className="text-green-600 font-mono text-sm truncate max-w-md">
                    {webhook.webhook_url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={webhook.is_active ? "default" : "secondary"}
                  className={`font-mono ${
                    webhook.is_active
                      ? "bg-green-600 text-black"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {webhook.is_active ? "ACTIVE" : "INACTIVE"}
                </Badge>
                <Button
                  onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono"
                >
                  {webhook.is_active ? "DISABLE" : "ENABLE"}
                </Button>
                <Button
                  onClick={() => deleteWebhook(webhook.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-black font-mono"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {webhooks.length === 0 && !isAddingWebhook && (
            <div className="text-center py-8 text-green-600 font-mono">
              No webhooks configured. Add your first n8n webhook to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default N8nWebhookManager;
