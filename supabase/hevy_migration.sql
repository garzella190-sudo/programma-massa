-- ==========================================
-- ALLENAMENTI MANU: HEVY-STYLE RESTRUCTURING
-- ==========================================

-- ATTENZIONE: Questo script elimina le tabelle esistenti (wipe dati)
-- e ricrea la struttura da zero per supportare il nuovo schema.

DROP TABLE IF EXISTS public.serie_allenamento CASCADE;
DROP TABLE IF EXISTS public.allenamenti CASCADE;
DROP TABLE IF EXISTS public.esercizi_scheda CASCADE;
DROP TABLE IF EXISTS public.schede_allenamento CASCADE;
DROP TABLE IF EXISTS public.esercizi_catalogo CASCADE;

-- 1. Catalogo Esercizi (Master List)
CREATE TABLE public.esercizi_catalogo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    gruppo_muscolare TEXT NOT NULL,
    attrezzatura TEXT NOT NULL DEFAULT 'Corpo libero',
    creato_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Schede di Allenamento (Templates)
CREATE TABLE public.schede_allenamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL DEFAULT 'Nuova Scheda',
    creato_at TIMESTAMPTZ DEFAULT now(),
    aggiornato_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Esercizi all'interno di una Scheda (Routine Target)
CREATE TABLE public.esercizi_scheda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheda_id UUID NOT NULL REFERENCES public.schede_allenamento(id) ON DELETE CASCADE,
    esercizio_id UUID NOT NULL REFERENCES public.esercizi_catalogo(id) ON DELETE CASCADE,
    serie_target INTEGER DEFAULT 3,
    reps_target TEXT DEFAULT '10', -- Testo perché potrebbe essere "8-12" o "Max"
    recupero_target INTEGER DEFAULT 60, -- Secondi
    ordine INTEGER DEFAULT 0,
    creato_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Allenamenti (Sessioni Live / Diario)
CREATE TABLE public.allenamenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheda_id UUID REFERENCES public.schede_allenamento(id) ON DELETE SET NULL, -- Opzionale (potrebbe essere un allenamento vuoto)
    nome TEXT NOT NULL DEFAULT 'Allenamento',
    inizio_at TIMESTAMPTZ DEFAULT now(),
    fine_at TIMESTAMPTZ, -- Se nullo, l'allenamento è ancora in corso
    note TEXT,
    creato_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Serie eseguite durante un Allenamento (Log reale)
CREATE TABLE public.serie_allenamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    allenamento_id UUID NOT NULL REFERENCES public.allenamenti(id) ON DELETE CASCADE,
    esercizio_id UUID NOT NULL REFERENCES public.esercizi_catalogo(id) ON DELETE CASCADE,
    tipo TEXT DEFAULT 'Normal', -- 'Normal', 'Warmup', 'Drop', 'Failure'
    peso DECIMAL DEFAULT 0,
    reps INTEGER DEFAULT 0,
    rpe DECIMAL, -- Rate of Perceived Exertion (Opzionale)
    creato_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

ALTER TABLE public.esercizi_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schede_allenamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esercizi_scheda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allenamenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serie_allenamento ENABLE ROW LEVEL SECURITY;

-- Esercizi Catalogo: Tutti gli utenti autenticati possono leggere il catalogo
CREATE POLICY "Tutti possono leggere il catalogo esercizi" 
ON public.esercizi_catalogo FOR SELECT USING (auth.role() = 'authenticated');

-- Schede: Gli utenti gestiscono le proprie schede
CREATE POLICY "Gli utenti gestiscono le proprie schede" 
ON public.schede_allenamento FOR ALL USING (auth.uid() = user_id);

-- Esercizi Scheda: Accesso basato sulla scheda proprietaria
CREATE POLICY "Gli utenti gestiscono esercizi delle proprie schede"
ON public.esercizi_scheda FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.schede_allenamento s 
  WHERE s.id = esercizi_scheda.scheda_id AND s.user_id = auth.uid()
));

-- Allenamenti: Gli utenti gestiscono i propri allenamenti
CREATE POLICY "Gli utenti gestiscono i propri allenamenti" 
ON public.allenamenti FOR ALL USING (auth.uid() = user_id);

-- Serie Allenamento: Accesso basato sull'allenamento proprietario
CREATE POLICY "Gli utenti gestiscono le serie dei propri allenamenti"
ON public.serie_allenamento FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.allenamenti a 
  WHERE a.id = serie_allenamento.allenamento_id AND a.user_id = auth.uid()
));

-- ==========================================
-- POPOLAMENTO DATABASE BASE (SEED)
-- ==========================================

INSERT INTO public.esercizi_catalogo (nome, gruppo_muscolare, attrezzatura) VALUES
('Panca Piana con Bilanciere', 'Petto', 'Bilanciere'),
('Panca Inclinata con Manubri', 'Petto', 'Manubri'),
('Croci ai Cavi', 'Petto', 'Cavi'),
('Squat con Bilanciere', 'Gambe', 'Bilanciere'),
('Leg Press', 'Gambe', 'Macchina'),
('Leg Extension', 'Gambe', 'Macchina'),
('Leg Curl', 'Gambe', 'Macchina'),
('Stacco da Terra', 'Dorso', 'Bilanciere'),
('Trazioni alla Sbarra', 'Dorso', 'Corpo libero'),
('Rematore con Bilanciere', 'Dorso', 'Bilanciere'),
('Lat Machine', 'Dorso', 'Macchina'),
('Pulley Basso', 'Dorso', 'Macchina'),
('Lento Avanti con Bilanciere', 'Spalle', 'Bilanciere'),
('Alzate Laterali', 'Spalle', 'Manubri'),
('Curl con Bilanciere', 'Bicipiti', 'Bilanciere'),
('Curl con Manubri', 'Bicipiti', 'Manubri'),
('Pushdown Tricipiti', 'Tricipiti', 'Cavi'),
('French Press', 'Tricipiti', 'Bilanciere EZ'),
('Crunch', 'Addome', 'Corpo libero'),
('Plank', 'Addome', 'Corpo libero');
