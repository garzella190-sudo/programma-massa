-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profili (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    altezza INTEGER, -- in cm
    peso DECIMAL, -- in kg
    esperienza TEXT CHECK (esperienza IN ('Principiante', 'Intermedio', 'Avanzato')),
    consumo_calorico INTEGER, -- kcal giornaliere
    obiettivi TEXT,
    creato_at TIMESTAMPTZ DEFAULT now(),
    aggiornato_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can manage their own profile" 
ON public.profili 
FOR ALL 
USING (auth.uid() = user_id);

-- 4. Trigger to update aggiornato_at
CREATE OR REPLACE FUNCTION update_aggiornato_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.aggiornato_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profili_aggiornato_at
    BEFORE UPDATE ON public.profili
    FOR EACH ROW
    EXECUTE PROCEDURE update_aggiornato_at_column();
