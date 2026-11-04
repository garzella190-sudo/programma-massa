'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { slugPiano } from '@/lib/slug'
import type { PianoAlimentazione } from '@/types/diet'

interface ExportPdfButtonProps {
  piano: PianoAlimentazione
  onToast?: (message: string, type: 'success' | 'error') => void
  /** Variante con etichetta testuale oppure solo icona */
  withLabel?: boolean
}

/**
 * Scarica il PDF del piano generato da `/api/pdf/piano/[id]` (jsPDF lato server,
 * quindi nessun peso nel bundle client).
 */
export function ExportPdfButton({ piano, onToast, withLabel = false }: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (loading) return
    setLoading(true)
    try {
      const risposta = await fetch(`/api/pdf/piano/${piano.id}`, { cache: 'no-store' })
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`)

      // Se la sessione è scaduta il middleware reindirizza al login: in quel caso
      // arriva una pagina HTML, non un PDF.
      const tipo = risposta.headers.get('content-type') ?? ''
      if (!tipo.includes('application/pdf')) throw new Error('Risposta non PDF (sessione scaduta?)')

      const blob = await risposta.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slugPiano(piano.nome)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      onToast?.('PDF generato', 'success')
    } catch (error) {
      console.error('[pdf] esportazione fallita:', error)
      onToast?.('Errore nella creazione del PDF', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (withLabel) {
    return (
      <button onClick={handleExport} disabled={loading} className="h-btn h-btn-outline" title="Esporta PDF">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        Esporta PDF
      </button>
    )
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="h-icon-btn"
      title="Esporta PDF"
      aria-label="Esporta PDF"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
    </button>
  )
}
