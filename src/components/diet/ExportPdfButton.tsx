'use client'

import { useState } from 'react'
import { FileDown, Loader2, ExternalLink } from 'lucide-react'
import { slugPiano } from '@/lib/slug'
import type { PianoAlimentazione } from '@/types/diet'

interface ExportPdfButtonProps {
  piano: PianoAlimentazione
  onToast?: (message: string, type: 'success' | 'error') => void
  /** Variante con etichetta testuale oppure solo icona */
  withLabel?: boolean
  /** `apri` mostra il PDF nel visualizzatore (lettura), `scarica` lo salva */
  modalita?: 'apri' | 'scarica'
  /** Etichetta personalizzata nella variante con testo */
  label?: string
}

/**
 * PDF del piano generato da `/api/pdf/piano/[id]` (jsPDF lato server,
 * quindi nessun peso nel bundle client).
 */
export function ExportPdfButton({
  piano,
  onToast,
  withLabel = false,
  modalita = 'scarica',
  label,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const url = `/api/pdf/piano/${piano.id}`

  // Apertura diretta: il browser mostra il PDF nel suo visualizzatore (sola lettura).
  const apriPdf = () => {
    const finestra = window.open(url, '_blank', 'noopener')
    if (!finestra) onToast?.('Consenti i popup per aprire il PDF', 'error')
  }

  const scaricaPdf = async () => {
    if (loading) return
    setLoading(true)
    try {
      const risposta = await fetch(url, { cache: 'no-store' })
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`)

      // Se la sessione è scaduta il middleware reindirizza al login: in quel caso
      // arriva una pagina HTML, non un PDF.
      const tipo = risposta.headers.get('content-type') ?? ''
      if (!tipo.includes('application/pdf')) throw new Error('Risposta non PDF (sessione scaduta?)')

      const blob = await risposta.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${slugPiano(piano.nome)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)

      onToast?.('PDF scaricato', 'success')
    } catch (error) {
      console.error('[pdf] esportazione fallita:', error)
      onToast?.('Errore nella creazione del PDF', 'error')
    } finally {
      setLoading(false)
    }
  }

  const azione = modalita === 'apri' ? apriPdf : scaricaPdf
  const Icona = modalita === 'apri' ? ExternalLink : FileDown
  const testo = label ?? (modalita === 'apri' ? 'Apri PDF' : 'Scarica PDF')
  const titolo = `${testo} — ${piano.nome}`

  if (withLabel) {
    return (
      <button onClick={azione} disabled={loading} className="h-btn h-btn-outline" title={titolo}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icona className="w-4 h-4" />}
        {testo}
      </button>
    )
  }

  return (
    <button
      onClick={azione}
      disabled={loading}
      className="h-icon-btn"
      title={titolo}
      aria-label={titolo}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icona className="w-4 h-4" />}
    </button>
  )
}
