import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { GhostButton, GlassCard } from '@/pages/admin/AdminLayout'
import RaceListPanel from './RaceListPanel'
import JudgeAssigner from './JudgeAssigner'

export default function TournamentJudgeWorkspace({ tournament, onBack }) {
  const [activeRaceId, setActiveRaceId] = useState(tournament.races[0]?.id ?? '')
  const [, forceRender] = useState(0)

  const activeRace =
    tournament.races.find((race) => race.id === activeRaceId) ?? tournament.races[0]

  const updateRaceJudges = (nextAssignments) => {
    if (!activeRace) return
    activeRace.judges = nextAssignments
    forceRender((value) => value + 1)
  }

  return (
    <AdminLayout
      heading="Phân công trọng tài"
      highlight={tournament.name}
      subtitle={`${tournament.location} · ${tournament.races.length} cuộc đua`}
      action={
        <>
          <GhostButton icon={ArrowLeft} onClick={onBack}>
            Danh sách giải
          </GhostButton>
          <Link to={`/admin/tournaments/${tournament.id}`}>
            <GhostButton icon={ArrowRight}>Mở giải đấu</GhostButton>
          </Link>
        </>
      }
    >
      {tournament.races.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/50">
          <Flag className="mx-auto mb-3 h-10 w-10 opacity-40" />
          Giải đấu này chưa có cuộc đua nào. Hãy thêm cuộc đua trước khi phân công trọng tài.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4">
            <RaceListPanel
              races={tournament.races}
              activeRaceId={activeRace?.id}
              onSelectRace={setActiveRaceId}
            />
          </div>
          <div className="min-w-0 lg:col-span-8">
            {activeRace ? <JudgeAssigner race={activeRace} onChangeJudges={updateRaceJudges} /> : null}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
