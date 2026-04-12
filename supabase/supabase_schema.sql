-- SQL Script for Supabase SQL Editor
-- This will create the necessary tables for Allenamenti Manu

-- 1. Create Workout Plans Table
CREATE TABLE IF NOT EXISTS public.schede_allenamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Nuova Scheda',
    creato_at TIMESTAMPTZ DEFAULT now(),
    aggiornato_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Exercises Table
CREATE TABLE IF NOT EXISTS public.esercizi_scheda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheda_id UUID NOT NULL REFERENCES public.schede_allenamento(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    serie INTEGER DEFAULT 3,
    reps INTEGER DEFAULT 10,
    peso TEXT DEFAULT '0', -- Using text for kg/lbs or "Max"
    recupero INTEGER DEFAULT 60, -- In seconds
    ordine INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}', -- Array of hashtag strings e.g. {'Stretching', 'Riscaldamento'}
    creato_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.schede_allenamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esercizi_scheda ENABLE ROW LEVEL SECURITY;

-- 4. Policies for schede_allenamento
CREATE POLICY "Users can manage their own plans" 
ON public.schede_allenamento 
FOR ALL 
USING (auth.uid() = user_id);

-- 5. Policies for esercizi_scheda (inherited via join or shared)
CREATE POLICY "Users can manage exercises of their plans"
ON public.esercizi_scheda
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.schede_allenamento s 
    WHERE s.id = esercizi_scheda.scheda_id AND s.user_id = auth.uid()
  )
);
