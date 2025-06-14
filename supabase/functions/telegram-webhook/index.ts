
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const telegramUpdate = await req.json()
    
    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!telegramUpdate.message) {
      return new Response('ok', { headers: corsHeaders })
    }

    const { message } = telegramUpdate
    const chatId = message.chat.id.toString()
    const messageText = message.text || ''
    const messageId = message.message_id

    // Find user by chat ID
    const { data: userSettings } = await supabaseClient
      .from('user_settings')
      .select('user_id, telegram_bot_token, openai_api_key, anthropic_api_key, default_ai_provider, default_model')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!userSettings) {
      return new Response('User not found', { headers: corsHeaders })
    }

    // Store incoming message
    await supabaseClient
      .from('telegram_messages')
      .insert({
        user_id: userSettings.user_id,
        message_id: messageId,
        chat_id: chatId,
        message_text: messageText,
        message_type: 'text',
        is_incoming: true,
        processed: false
      })

    // Process message with AI agent
    let agentType = 'general_assistant'
    
    // Determine agent type based on message content
    if (messageText.toLowerCase().includes('note') || messageText.toLowerCase().includes('save')) {
      agentType = 'note_taker'
    } else if (messageText.toLowerCase().includes('research') || messageText.toLowerCase().includes('find out')) {
      agentType = 'research'
    } else if (messageText.toLowerCase().includes('break down') || messageText.toLowerCase().includes('steps')) {
      agentType = 'task_breakdown'
    } else if (messageText.toLowerCase().includes('learn') || messageText.toLowerCase().includes('plan')) {
      agentType = 'learning_plan'
    }

    // Get AI response
    let aiResponse = "I'm your AI assistant! I can help you with notes, research, task planning, and learning. How can I assist you today?"
    
    if (userSettings.openai_api_key || userSettings.anthropic_api_key) {
      try {
        const agentPrompts = {
          research: `You are a research assistant. Provide research insights and suggest areas to investigate.`,
          task_breakdown: `You are a task breakdown specialist. Break down goals into actionable subtasks.`,
          learning_plan: `You are a learning plan creator. Create learning roadmaps and suggest resources.`,
          note_taker: `You are a note-taking assistant. Help organize information into clear notes.`,
          general_assistant: `You are a helpful AI assistant for learning and productivity.`
        }

        const systemPrompt = agentPrompts[agentType as keyof typeof agentPrompts]

        if (userSettings.default_ai_provider === 'openai' && userSettings.openai_api_key) {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userSettings.openai_api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: userSettings.default_model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: messageText }
              ],
              temperature: 0.7,
              max_tokens: 500
            }),
          })
          
          const openaiData = await openaiResponse.json()
          aiResponse = openaiData.choices[0]?.message?.content || aiResponse
        } else if (userSettings.anthropic_api_key) {
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': userSettings.anthropic_api_key,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: userSettings.default_model || 'claude-3-5-sonnet-20241022',
              max_tokens: 500,
              messages: [
                { role: 'user', content: `${systemPrompt}\n\nUser message: ${messageText}` }
              ],
            }),
          })
          
          const anthropicData = await anthropicResponse.json()
          aiResponse = anthropicData.content[0]?.text || aiResponse
        }

        // Create note if it's a note-taking request
        if (agentType === 'note_taker') {
          const lines = aiResponse.split('\n').filter(line => line.trim())
          const title = lines[0]?.replace(/^#+\s*/, '') || 'Telegram Note'
          const content = lines.slice(1).join('\n') || aiResponse
          
          await supabaseClient
            .from('notes')
            .insert({
              user_id: userSettings.user_id,
              title,
              content,
              agent_generated: true,
              tags: ['telegram', 'ai-generated']
            })
        }

      } catch (error) {
        console.error('AI processing error:', error)
      }
    }

    // Send response back to Telegram
    if (userSettings.telegram_bot_token) {
      await fetch(`https://api.telegram.org/bot${userSettings.telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiResponse,
          parse_mode: 'Markdown'
        })
      })
    }

    // Store outgoing message
    await supabaseClient
      .from('telegram_messages')
      .insert({
        user_id: userSettings.user_id,
        message_id: 0, // Telegram will provide actual ID
        chat_id: chatId,
        message_text: aiResponse,
        message_type: 'text',
        is_incoming: false,
        processed: true,
        agent_response: aiResponse
      })

    return new Response('ok', { headers: corsHeaders })

  } catch (error) {
    console.error('Telegram webhook error:', error)
    return new Response('Error', { status: 500, headers: corsHeaders })
  }
})
