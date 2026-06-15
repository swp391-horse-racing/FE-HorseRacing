import { Plus, Star, UserCheck } from 'lucide-react'
import { GlassCard, Pill, Select } from '@/pages/admin/AdminLayout'
import { JUDGE_ROLES, MOCK_REFEREES, refereeInitial, refereeLevelTone } from '@/data/adminJudgeMock'

export default function AvailableRefereesPanel({ assignedIds, pickRole, onPickRole, onAdd }) {
  const available = MOCK_REFEREES.filter((referee) => !assignedIds.has(referee.id))

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-[#D4A017]" />
          <div>
            <h3 className="font-bold text-white">Trọng tài khả dụng</h3>
            <p className="text-xs text-white/50">{available.length} trọng tài chưa được phân công</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Vai trò khi thêm:</span>
          <Select value={pickRole} onChange={(event) => onPickRole(event.target.value)} className="!w-auto text-xs">
            {JUDGE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        {available.map((referee) => (
          <div
            key={referee.id}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold text-white/70">
              {refereeInitial(referee.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-white">{referee.name}</span>
                <Pill tone={refereeLevelTone(referee.level)}>{referee.level}</Pill>
              </div>
              <div className="flex items-center gap-1 truncate text-[10px] text-white/40">
                <Star className="h-3 w-3 text-[#D4A017]" />
                {referee.experience} năm · {referee.specialty}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAdd(referee.id, pickRole)}
              className="shrink-0 rounded-lg p-2 text-emerald-300/80 transition-all hover:bg-emerald-500/10 hover:text-emerald-300"
              title="Thêm vào tổ trọng tài"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}

        {available.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40 sm:col-span-2">
            Tất cả trọng tài đã được phân công.
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}
