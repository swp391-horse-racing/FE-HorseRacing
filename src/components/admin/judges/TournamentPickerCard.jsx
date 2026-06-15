import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { GlassCard, Pill } from '@/pages/admin/AdminLayout'
import { isRaceJudgeReady, judgeStatusTone } from '@/data/adminJudgeMock'
import JudgeMetric from './JudgeMetric'

export default function TournamentPickerCard({ tournament, onSelect }) {
  const readyCount = tournament.races.filter(isRaceJudgeReady).length
  const totalJudges = tournament.races.reduce((sum, race) => sum + (race.judges?.length ?? 0), 0)

  return (
    <button type="button" onClick={() => onSelect(tournament.id)} className="group text-left">
      <GlassCard className="h-full overflow-hidden transition-all group-hover:border-[#D4A017]/50 group-hover:shadow-lg group-hover:shadow-[#D4A017]/10">
        <div className="relative h-32">
          <img src={tournament.banner} alt={tournament.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/50 to-transparent" />
          <div className="absolute left-3 top-3">
            <Pill tone={judgeStatusTone(tournament.status)}>{tournament.status}</Pill>
          </div>
        </div>
        <div className="p-5">
          <h3 className="mb-1 font-bold text-white transition-colors group-hover:text-[#D4A017]">
            {tournament.name}
          </h3>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#D4A017]" />
              {tournament.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#D4A017]" />
              {tournament.startDate}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <JudgeMetric label="Cuộc đua" value={String(tournament.races.length)} />
            <JudgeMetric
              label="Đã đủ"
              value={`${readyCount}/${tournament.races.length}`}
              tone={
                readyCount === tournament.races.length && tournament.races.length > 0
                  ? 'green'
                  : 'gold'
              }
            />
            <JudgeMetric label="Lượt TT" value={String(totalJudges)} />
          </div>
          <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-[#D4A017] transition-all group-hover:gap-2">
            Phân công trọng tài
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </GlassCard>
    </button>
  )
}
