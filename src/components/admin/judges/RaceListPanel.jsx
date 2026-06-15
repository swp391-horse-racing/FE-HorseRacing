import { AlertTriangle, CheckCircle2, Flag, Gavel } from 'lucide-react'
import { GlassCard } from '@/pages/admin/AdminLayout'
import { isRaceJudgeReady } from '@/data/adminJudgeMock'

export default function RaceListPanel({ races, activeRaceId, onSelectRace }) {
  return (
    <GlassCard className="h-fit p-4 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-4 w-4 shrink-0 text-[#D4A017]" />
        <h3 className="font-bold text-white">Cuộc đua</h3>
      </div>
      <div className="max-h-[600px] space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
        {races.map((race) => {
          const active = race.id === activeRaceId
          const count = race.judges?.length ?? 0
          const ready = isRaceJudgeReady(race)

          return (
            <button
              key={race.id}
              type="button"
              onClick={() => onSelectRace(race.id)}
              className={`w-full rounded-2xl border-2 p-3 text-left transition-all ${
                active
                  ? 'border-[#D4A017] bg-[#D4A017]/15 shadow-md shadow-[#D4A017]/20'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                      active
                        ? 'border-[#D4A017] bg-[#D4A017] text-white'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    R{race.no}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{race.name}</div>
                    <div className="text-[10px] text-white/50">
                      {race.date} · {race.time}
                    </div>
                  </div>
                </div>
                {ready ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400/70" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                <Gavel className="h-3 w-3 text-[#D4A017]" />
                {count} trọng tài
              </div>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
