'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Edit2, Pill, Trash2 } from 'lucide-react'
import { abbinaIntegrazione, eliminaPiano, rinominaPiano } from '@/actions/alimentazione'
import { cn } from '@/lib/utils'
import type { ToastType } from '@/components/ui/Toast'
import type { PianoAlimentazione } from '@/types/diet'
import Select from '@/components/ui/Select'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { ExportPdfButton } from './ExportPdfButton'
import { DietPlanTable } from './DietPlanTable'

interface DietPlanCardProps {
  piano: PianoAlimentazione
  integrazioni: PianoAlimentazione[]
  espanso: boolean
  onToggle: () => void
  onRefresh: () => void | Promise<void>
  onToast: (message: string, type: ToastType) => void
}

export function DietPlanCard({
  piano,
  integrazioni,
  espanso,
  onToggle,
  onRefresh,
  onToast,
}: DietPlanCardProps) {
  const [inRinomina, setInRinomina] = useState(false)
  const [nome, setNome] = useState(piano.nome)

  const integrazioneAbbinata = integrazioni.find((i) => i.id === piano.integrazione_abbinata_id) ?? null

  const salvaNome = async () => {
    const pulito = nome.trim()
    setInRinomina(false)
    if (!pulito || pulito === piano.nome) {
      setNome(piano.nome)
      return
    }
    try {
      await rinominaPiano(piano.id, pulito)
      await onRefresh()
    } catch (error) {
      console.error(error)
      onToast('Errore rinomina', 'error')
      setNome(piano.nome)
    }
  }

  const elimina = async () => {
    try {
      await eliminaPiano(piano.id)
      await onRefresh()
      onToast('Piano eliminato', 'success')
    } catch (error) {
      console.error(error)
      onToast('Errore eliminazione', 'error')
    }
  }

  const abbina = async (valore: string) => {
    try {
      await abbinaIntegrazione(piano.id, valore === 'none' ? null : valore)
      await onRefresh()
    } catch (error) {
      console.error(error)
      onToast('Errore abbinamento', 'error')
    }
  }

  return (
    <div className="h-card overflow-hidden mb-3">
      {/* Header piano */}
      <div className="flex items-center gap-2 px-3 py-3">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <span className={cn('shrink-0 transition-colors', espanso ? 'text-accent' : 'text-ink-3')}>
            {espanso ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>

          {inRinomina ? (
            <span className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void salvaNome()
                  if (e.key === 'Escape') {
                    setNome(piano.nome)
                    setInRinomina(false)
                  }
                }}
                className="h-field flex-1 h-9 py-1"
              />
              <button onClick={() => void salvaNome()} className="h-icon-btn text-done" title="Conferma">
                <Check className="w-4 h-4" />
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-2 min-w-0">
              <h3 className="h-card-title truncate">{piano.nome}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNome(piano.nome)
                  setInRinomina(true)
                }}
                className="p-1 text-ink-3 hover:text-accent shrink-0"
                title="Rinomina"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <span className="h-label shrink-0 normal-case tracking-normal">
            {piano.righe?.length ?? 0} voci
          </span>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <ExportPdfButton piano={piano} onToast={(m, t) => onToast(m, t)} />
          <ConfirmBubble
            title="Elimina piano"
            message={`Vuoi davvero eliminare "${piano.nome}"?`}
            onConfirm={() => void elimina()}
            trigger={
              <button className="h-icon-btn hover:text-danger" title="Elimina piano">
                <Trash2 className="w-4 h-4" />
              </button>
            }
          />
        </div>
      </div>

      {/* Contenuto piano */}
      {espanso && (
        <div className="px-3.5 pb-3.5 animate-fade-in">
          {piano.tipo === 'alimentazione' && integrazioni.length > 0 && (
            <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-field/60 mb-1">
              <Pill className="w-4 h-4 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="h-label mb-1">Integrazione abbinata</p>
                <Select
                  options={[
                    { id: 'none', label: 'Nessuna integrazione' },
                    ...integrazioni.map((i) => ({ id: i.id, label: i.nome })),
                  ]}
                  value={piano.integrazione_abbinata_id || 'none'}
                  onChange={(valore) => void abbina(valore as string)}
                />
              </div>
            </div>
          )}

          <DietPlanTable
            piano={piano}
            integrazioni={integrazioni}
            onRefresh={onRefresh}
            onToast={onToast}
          />

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <ExportPdfButton
              piano={piano}
              onToast={(messaggio, tipo) => onToast(messaggio, tipo)}
              withLabel
            />
            <span className="h-caption">
              {integrazioneAbbinata
                ? `Include l'integrazione "${integrazioneAbbinata.nome}"`
                : 'PDF A4 pronto da stampare o condividere'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
