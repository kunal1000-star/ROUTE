// Study Assistant API - Phase 4: Study Buddy Integration
// ====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-fixed';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      conversationId, 
      message, 
      chatType,
      isPersonalQuery = false
    } = await request.json();

    if (!userId || !message || !chatType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, message, chatType' },
        { status: 400 }
      );
    }

    // If no conversationId provided, create new conversation
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          chat_type: chatType,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      finalConversationId = newConversation.id;
    }

    // Store user message
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'user',
        content: message,
        context_included: isPersonalQuery
      });

    if (userMessageError) {
      console.error('User message error:', userMessageError);
      // Don't fail the entire request if message storage fails
    }

    // Call AI Service Manager
    const aiResponse = await aiServiceManager.processQuery({
      userId,
      message,
      conversationId: finalConversationId,
      chatType: 'study_assistant',
      includeAppData: isPersonalQuery
    });

    // Store AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'assistant',
        content: aiResponse.content,
        model_used: aiResponse.model_used,
        provider_used: aiResponse.provider,
        tokens_used: aiResponse.tokens_used?.input + aiResponse.tokens_used?.output || 0,
        latency_ms: aiResponse.latency_ms,
        context_included: isPersonalQuery
      });

    if (aiMessageError) {
      console.error('AI message error:', aiMessageError);
      // Don't fail the entire request if AI response storage fails
    }

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', finalConversationId);

    return NextResponse.json({
      success: true,
      data: {
        response: {
          content: aiResponse.content,
          model_used: aiResponse.model_used,
          provider_used: aiResponse.provider,
          tokens_used: aiResponse.tokens_used || { input: 0, output: 0 },
          latency_ms: aiResponse.latency_ms,
          query_type: aiResponse.query_type || 'general',
          web_search_enabled: aiResponse.web_search_enabled || false,
          fallback_used: aiResponse.fallback_used || false,
          cached: aiResponse.cached || false,
          isTimeSensitive: false,
          language: 'hinglish',
          memory_references: []
        }
      },
      conversationId: finalConversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Study assistant send error:', error);
    
    // Handle different error types with consistent formatting
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit reached. Please wait before sending another message.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message.includes('service unavailable')) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is temporarily unavailable. Please try again later.',
          retryAfter: 30
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
