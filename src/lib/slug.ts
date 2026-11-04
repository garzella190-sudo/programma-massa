/**
 * Utility di slug condivise (client + server). Nessuna dipendenza esterna.
 */

export function slugify(testo: string, fallback = 'file'): string {
  return (
    testo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  )
}

export function slugPiano(nome: string): string {
  return slugify(nome, 'piano')
}
