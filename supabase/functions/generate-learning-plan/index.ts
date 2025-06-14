
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
    const { subject, difficulty = 'beginner' } = await req.json()
    
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
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
        JSON.stringify({ error: 'No AI API key configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate learning plan using AI
    const prompt = `Create a detailed learning plan for "${subject}" at ${difficulty} level. 
    Include 5-8 modules with titles, descriptions, and estimated time for each module.
    Format as JSON with structure: { "modules": [{ "title": "", "description": "", "estimatedHours": 0, "resources": [""], "completed": false }] }`

    let aiResponse
    
    if (settings.default_ai_provider === 'openai' && settings.openai_api_key) {
      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openai_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.default_model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert learning plan creator. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      })
      
      const openaiData = await openaiResponse.json()
      aiResponse = openaiData.choices[0]?.message?.content
    } else if (settings.anthropic_api_key) {
      // Call Anthropic API
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': settings.anthropic_api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: settings.default_model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      })
      
      const anthropicData = await anthropicResponse.json()
      aiResponse = anthropicData.content[0]?.text
    }

    if (!aiResponse) {
      throw new Error('No AI response received')
    }

    // Parse AI response
    let planData
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      planData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse)
    } catch (parseError) {
      // Fallback to a default structure
      planData = {
        modules: [
          { title: `Introduction to ${subject}`, description: `Learn the basics of ${subject}`, estimatedHours: 4, completed: false },
          { title: `Core Concepts`, description: `Understand fundamental concepts`, estimatedHours: 8, completed: false },
          { title: `Practical Applications`, description: `Apply knowledge in real scenarios`, estimatedHours: 12, completed: false },
          { title: `Advanced Topics`, description: `Explore advanced techniques`, estimatedHours: 16, completed: false },
          { title: `Project Work`, description: `Build a complete project`, estimatedHours: 20, completed: false }
        ]
      }
    }

    // Add unique IDs to modules and ensure they have completed status
    const modulesWithIds = planData.modules?.map((module: any, index: number) => ({
      ...module,
      id: `${crypto.randomUUID()}`,
      completed: false,
      estimatedHours: module.estimatedHours || 4
    })) || []

    // Calculate estimated duration
    const totalHours = modulesWithIds.reduce((sum: number, module: any) => sum + (module.estimatedHours || 4), 0)
    const estimatedDays = Math.ceil(totalHours / 2) // Assuming 2 hours per day

    // Create learning plan in database
    const { data: newPlan, error: insertError } = await supabaseClient
      .from('learning_plans')
      .insert({
        user_id: user.id,
        title: `AI-Generated: ${subject} Learning Plan`,
        description: `Comprehensive ${difficulty}-level learning plan for ${subject}`,
        subject: subject,
        difficulty_level: difficulty,
        estimated_duration: estimatedDays,
        plan_data: modulesWithIds,
        agent_generated: true,
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        plan: newPlan,
        totalModules: modulesWithIds.length,
        estimatedDays
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating learning plan:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate learning plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
