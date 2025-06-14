
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Key, Bot, MessageSquare, Save } from 'lucide-react';
import TerminalHeader from '@/components/TerminalHeader';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    openai_api_key: '',
    anthropic_api_key: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    default_ai_provider: 'openai',
    default_model: 'gpt-4o-mini'
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings({
        openai_api_key: data.openai_api_key || '',
        anthropic_api_key: data.anthropic_api_key || '',
        telegram_bot_token: data.telegram_bot_token || '',
        telegram_chat_id: data.telegram_chat_id || '',
        default_ai_provider: data.default_ai_provider || 'openai',
        default_model: data.default_model || 'gpt-4o-mini'
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "SUCCESS",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "ERROR",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-green-400 font-mono">SYSTEM SETTINGS</h1>
          </div>

          {/* AI Provider Settings */}
          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-green-500" />
                <div>
                  <CardTitle className="text-green-400 font-mono">AI PROVIDER CONFIGURATION</CardTitle>
                  <CardDescription className="text-green-600 font-mono text-sm">
                    Configure your AI provider and model preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">DEFAULT AI PROVIDER</Label>
                  <Select value={settings.default_ai_provider} onValueChange={(value) => setSettings(prev => ({ ...prev, default_ai_provider: value }))}>
                    <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-500">
                      <SelectItem value="openai">OPENAI</SelectItem>
                      <SelectItem value="anthropic">ANTHROPIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">DEFAULT MODEL</Label>
                  <Select value={settings.default_model} onValueChange={(value) => setSettings(prev => ({ ...prev, default_model: value }))}>
                    <SelectTrigger className="bg-black border-green-500 text-green-400 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-500">
                      {settings.default_ai_provider === 'openai' ? (
                        <>
                          <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4O MINI</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="claude-3-5-sonnet-20241022">CLAUDE 3.5 SONNET</SelectItem>
                          <SelectItem value="claude-3-haiku-20240307">CLAUDE 3 HAIKU</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-green-500" />
                <div>
                  <CardTitle className="text-green-400 font-mono">API KEYS</CardTitle>
                  <CardDescription className="text-green-600 font-mono text-sm">
                    Enter your API keys for AI providers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">OPENAI API KEY</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={settings.openai_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value }))}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">ANTHROPIC API KEY</Label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.anthropic_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Telegram Integration */}
          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-green-500" />
                <div>
                  <CardTitle className="text-green-400 font-mono">TELEGRAM INTEGRATION</CardTitle>
                  <CardDescription className="text-green-600 font-mono text-sm">
                    Connect your Telegram bot for seamless AI assistance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">TELEGRAM BOT TOKEN</Label>
                <Input
                  type="password"
                  placeholder="123456789:ABC..."
                  value={settings.telegram_bot_token}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-green-400 font-mono">TELEGRAM CHAT ID</Label>
                <Input
                  placeholder="Your chat ID"
                  value={settings.telegram_chat_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                  className="bg-black border-green-500 text-green-400 font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-black font-mono text-lg py-6"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'SAVING...' : 'SAVE SETTINGS'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
