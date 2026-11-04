import DietSchedule from '@/components/diet/DietSchedule'

export const metadata = {
  title: 'Dieta | Allenamenti Manu',
}

export default function DietaPage() {
  return (
    <main className="flex-1 flex flex-col">
      <DietSchedule />
    </main>
  )
}
