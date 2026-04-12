-- Migration: Alimentazione & Integrazione
-- Run in Supabase SQL Editor

-- 1. Piani (alimentazione + integrazione)
CREATE TABLE IF NOT EXISTS public.piani_alimentazione (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Nuovo Piano',
  tipo TEXT NOT NULL CHECK (tipo IN ('alimentazione', 'integrazione')),
  creato_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Righe di ogni piano
CREATE TABLE IF NOT EXISTS public.righe_piano (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piano_id UUID NOT NULL REFERENCES public.piani_alimentazione(id) ON DELETE CASCADE,
  orario TEXT DEFAULT '',
  voce TEXT DEFAULT '',
  quantita TEXT DEFAULT '',
  note TEXT DEFAULT '',
  ordine INTEGER DEFAULT 0
);

-- 3. Colonna attiva per schede_allenamento
ALTER TABLE public.schede_allenamento 
ADD COLUMN IF NOT EXISTS attiva BOOLEAN DEFAULT true;

-- 4. Colonna tags per esercizi
ALTER TABLE public.esercizi_scheda 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 5. RLS
ALTER TABLE public.piani_alimentazione ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.righe_piano ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plans" 
ON public.piani_alimentazione 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage rows of their plans"
ON public.righe_piano
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.piani_alimentazione p 
    WHERE p.id = righe_piano.piano_id AND p.user_id = auth.uid()
  )
);
