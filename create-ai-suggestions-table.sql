-- Create AI Suggestions table
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_impact integer NOT NULL DEFAULT 5,
  reasoning text,
  actionable_steps jsonb,
  related_topics jsonb,
  confidence_score decimal(3,2) NOT NULL DEFAULT 0.5,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_applied boolean NOT NULL DEFAULT false,
  applied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours')
);

-- Create suggestion interactions table
CREATE TABLE IF NOT EXISTS public.suggestion_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  suggestion_id uuid REFERENCES public.ai_suggestions(id),
  interaction_type text NOT NULL,
  feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create suggestion generation logs table
CREATE TABLE IF NOT EXISTS public.suggestion_generation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  generation_type text NOT NULL,
  input_data jsonb,
  output_count integer NOT NULL DEFAULT 0,
  generation_time_ms integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_active ON public.ai_suggestions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_expires ON public.ai_suggestions(expires_at) WHERE expires_at > now();
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_user_id ON public.suggestion_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_suggestion_id ON public.suggestion_interactions(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON public.suggestion_generation_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_generation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_suggestions
CREATE POLICY IF NOT EXISTS "Users can view their own AI suggestions" ON public.ai_suggestions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own AI suggestions" ON public.ai_suggestions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own AI suggestions" ON public.ai_suggestions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create RLS policies for suggestion_interactions
CREATE POLICY IF NOT EXISTS "Users can view their own interactions" ON public.suggestion_interactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own interactions" ON public.suggestion_interactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create RLS policies for suggestion_generation_logs
CREATE POLICY IF NOT EXISTS "Users can view their own generation logs" ON public.suggestion_generation_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own generation logs" ON public.suggestion_generation_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);