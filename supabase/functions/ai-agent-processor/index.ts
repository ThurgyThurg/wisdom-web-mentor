import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const agentList = [
  { value: 'general_assistant', label: 'General Assistant', description: 'For general questions, conversation, and advice.' },
  { value: 'research', label: 'Research Assistant', description: 'For requests that involve finding and summarizing information.' },
  { value: 'task_breakdown', label: 'Task Breakdown Specialist', description: 'For requests to break down a large goal or task into smaller steps.' },
  { value: 'learning_plan', label: 'Learning Plan Creator', description: 'For requests to create a learning plan for a specific topic.' },
  { value: 'note_taker', label: 'Note Taker', description: "For requests to save information as a note. Use this if the user says 'take a note', 'save this', or 'create a note'." },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId, conversationId } = await req.json()
    
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user settings for AI provider
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!settings?.openai_api_key && !settings?.anthropic_api_key) {
      return new Response(
        JSON.stringify({ error: 'No AI API key configured in settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Agent Router Logic ---
    const routerPrompt = `You are an agent router. Your job is to determine the best agent to handle a user's request. Based on the user's message, select one of the following agents:\n${agentList.map(a => `- '${a.value}': ${a.description}`).join('\n')}\n\nUser message: "${message}"\n\nRespond with ONLY the agent name (e.g., 'task_breakdown').`
    
    let agentType = 'general_assistant'; // Default agent

    try {
      let routerResponseText;
      if (settings.default_ai_provider === 'openai' && settings.openai_api_key) {
        const routerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.openai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: routerPrompt }],
            temperature: 0,
          }),
        });
        const routerData = await routerResponse.json();
        if (!routerResponse.ok) throw new Error(routerData.error?.message || 'Agent Router OpenAI API error');
        routerResponseText = routerData.choices[0]?.message?.content;
      } else if (settings.anthropic_api_key) {
         const routerResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': settings.anthropic_api_key,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307', // Use a fast model for routing
              max_tokens: 50,
              messages: [{ role: 'user', content: routerPrompt }],
            }),
          });
          const routerData = await routerResponse.json();
          if (!routerResponse.ok) throw new Error(routerData.error?.message || 'Agent Router Anthropic API error');
          routerResponseText = routerData.content[0]?.text;
      }

      if (routerResponseText) {
        const potentialAgent = routerResponseText.trim().replace(/'/g, '');
        if (agentList.some(a => a.value === potentialAgent)) {
          agentType = potentialAgent;
        }
      }
    } catch(e) {
      console.error("Error in agent router, falling back to general assistant:", e.message);
      // Fallback to general_assistant is already the default
    }
    // --- End Agent Router Logic ---

    // Define agent behaviors
    const agentPrompts = {
      research: `You are a research assistant. Analyze the user's message and provide detailed research insights. If the user asks for research on a topic, break it down into key areas to investigate and suggest reliable sources.`,
      task_breakdown: `You are a task breakdown specialist. Take the user's goal or task and break it down into smaller, actionable subtasks. Each subtask should be specific, measurable, and have a clear outcome. Respond with a list of tasks.`,
      learning_plan: `You are a learning plan creator. Create comprehensive learning plans based on the user's subject or skill they want to learn. Include modules, timeline, and resources.`,
      note_taker: `You are a note-taking assistant. Help organize and structure information into clear, searchable notes. Extract key points and create summaries. Start your response with a title for the note.`,
      general_assistant: `You are a helpful AI assistant focused on learning and productivity. Provide clear, actionable advice and help users achieve their goals.`
    }

    const systemPrompt = agentPrompts[agentType as keyof typeof agentPrompts] || agentPrompts.general_assistant;

    let history: { role: string; content: string }[] = [];
    if (conversationId) {
      const { data: convData } = await supabaseClient
        .from('chat_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();
      if (convData && Array.isArray(convData.messages)) {
        history = convData.messages;
      }
    }

    const messagesForLLM = [...history, { role: 'user', content: message }];

    let aiResponse
    
    if (settings.default_ai_provider === 'openai' && settings.openai_api_key) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openai_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.default_model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesForLLM
          ],
          temperature: 0.7,
        }),
      })
      
      const openaiData = await openaiResponse.json()
      if (!openaiResponse.ok) throw new Error(openaiData.error?.message || 'OpenAI API error');
      aiResponse = openaiData.choices[0]?.message?.content
    } else if (settings.anthropic_api_key) {
      // Anthropic does not support system prompts in the same way, prepend it.
      const anthropicMessages = messagesForLLM.map(m => ({ role: m.role, content: m.content }));
      
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': settings.anthropic_api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: settings.default_model || 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: systemPrompt,
          messages: anthropicMessages,
        }),
      })
      
      const anthropicData = await anthropicResponse.json()
      if (!anthropicResponse.ok) throw new Error(anthropicData.error?.message || 'Anthropic API error');
      aiResponse = anthropicData.content[0]?.text
    }

    if (!aiResponse) {
      throw new Error('No AI response received')
    }
    
    // Update conversation history
    const newUserMessage = { role: 'user', content: message };
    const newAiMessage = { role: 'assistant', content: aiResponse };
    const updatedHistory = [...history, newUserMessage, newAiMessage];
    
    let currentConversationId = conversationId;
    if (currentConversationId) {
      await supabaseClient.from('chat_conversations').update({ messages: updatedHistory, updated_at: new Date().toISOString() }).eq('id', currentConversationId);
    } else {
      const { data: newConv } = await supabaseClient.from('chat_conversations').insert({ user_id: user.id, messages: updatedHistory, title: message.substring(0, 50) }).select('id').single();
      currentConversationId = newConv?.id;
    }


    // Process the response based on agent type
    let actionTaken = 'response'
    
    if (agentType === 'note_taker' || message.toLowerCase().includes('save note') || message.toLowerCase().includes('create note')) {
      const lines = aiResponse.split('\n').filter(line => line.trim())
      const title = lines[0]?.replace(/^#+\s*/, '') || 'AI Generated Note'
      const content = lines.slice(1).join('\n') || aiResponse
      
      await supabaseClient
        .from('notes')
        .insert({ user_id: user.id, title, content, agent_generated: true, tags: ['ai-generated', agentType] })
      
      actionTaken = 'note_created'
    } else if (agentType === 'task_breakdown' || message.toLowerCase().includes('break down') || message.toLowerCase().includes('subtasks')) {
      const tasks = aiResponse.split('\n')
        .filter(line => line.trim() && (line.includes('•') || line.includes('-') || /^\d+\./.test(line)))
        .map(line => line.replace(/^[•\-\d\.]\s*/, '').trim())
        .filter(task => task.length > 0)
      
      const mainTitle = message.replace(/break down/i, '').trim() || 'AI Generated Task Plan'
      
      const { data: mainTask } = await supabaseClient
        .from('tasks')
        .insert({ user_id: user.id, title: mainTitle, description: 'Task breakdown created by AI', agent_generated: true, priority: 'medium' })
        .select()
        .single()

      if (mainTask && tasks.length > 0) {
        for (const task of tasks.slice(0, 10)) { // Limit to 10 subtasks
          await supabaseClient
            .from('tasks')
            .insert({ user_id: user.id, title: task, parent_task_id: mainTask.id, agent_generated: true, priority: 'medium' })
        }
      }
      
      actionTaken = 'tasks_created'
    }

    return new Response(
      JSON.stringify({ response: aiResponse, actionTaken, agentType, conversationId: currentConversationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing AI agent request:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process AI agent request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
