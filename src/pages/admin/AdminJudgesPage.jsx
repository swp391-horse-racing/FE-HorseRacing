import { useMemo, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { MOCK_JUDGE_TOURNAMENTS } from '@/data/adminJudgeMock'
import TournamentJudgeWorkspace from '@/components/admin/judges/TournamentJudgeWorkspace'
import TournamentPickerGrid from '@/components/admin/judges/TournamentPickerGrid'

export default function AdminJudgesPage() {
  const [tournamentId, setTournamentId] = useState(null)
  const [tournaments] = useState(() =>
    structuredClone(MOCK_JUDGE_TOURNAMENTS),
  )

  const tournament = useMemo(
    () => tournaments.find((item) => item.id === tournamentId) ?? null,
    [tournamentId, tournaments],
  )

  if (tournament) {
    return <TournamentJudgeWorkspace tournament={tournament} onBack={() => setTournamentId(null)} />
  }

  return (
    <AdminLayout
      heading="Phân công trọng tài"
      highlight="Admin"
      subtitle="Chọn một giải đấu để bắt đầu phân công trọng tài cho từng cuộc đua"
    >
      <TournamentPickerGrid tournaments={tournaments} onSelect={setTournamentId} />
    </AdminLayout>
  )
}
