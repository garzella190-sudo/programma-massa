-- Migration: Add tags column to esercizi_scheda
-- Run this in Supabase SQL Editor

ALTER TABLE public.esercizi_scheda 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
