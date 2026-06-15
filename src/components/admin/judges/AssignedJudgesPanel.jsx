import { Gavel, Send, Trash2 } from 'lucide-react'
import { GhostButton, GlassCard, Pill, PrimaryButton, Select } from '@/pages/admin/AdminLayout'
import { JUDGE_ROLES, judgeStatusTone, refereeInitial, refereeLevelTone } from '@/data/adminJudgeMock'

export default function AssignedJudgesPanel({
  race,
  assignments,
  refereesById,
  onClearAll,
  onRemove,
  onChangeRole,
  ready,
}) {
  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A017]/15">
            <Gavel className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Tổ trọng tài · {race.name}</h2>
            <p className="text-xs text-white/50">
              {assignments.length} trọng tài · {race.date} · {race.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={judgeStatusTone(race.status)}>{race.status}</Pill>
          {assignments.length > 0 ? (
            <GhostButton onClick={onClearAll}>Xóa hết</GhostButton>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 p-5">
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
            Chưa phân công trọng tài nào. Chọn trọng tài từ danh sách bên dưới để thêm vào tổ.
          </div>
        ) : null}

        {assignments.map((assignment) => {
          const referee = refereesById.get(assignment.refereeId)
          if (!referee) return null
          const isChief = assignment.role === 'Trọng tài chính'

          return (
            <div
              key={assignment.refereeId}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                isChief
                  ? 'border-[#D4A017]/40 bg-gradient-to-r from-[#D4A017]/15 to-transparent'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                  isChief ? 'bg-[#D4A017] text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                {refereeInitial(referee.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">{referee.name}</span>
                  <Pill tone={refereeLevelTone(referee.level)}>{referee.level}</Pill>
                </div>
                <div className="truncate text-[11px] text-white/50">
                  {referee.license} · {referee.experience} năm KN · {referee.specialty}
                </div>
              </div>
              <Select
                value={assignment.role}
                onChange={(event) => onChangeRole(assignment.refereeId, event.target.value)}
                className="!w-auto text-xs"
              >
                {JUDGE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => onRemove(assignment.refereeId)}
                className="shrink-0 rounded-lg p-2 text-white/50 transition-all hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {assignments.length > 0 ? (
        <div className="flex justify-end p-5 pt-0">
          <PrimaryButton icon={Send} disabled={!ready}>
            Gửi quyết định phân công
          </PrimaryButton>
        </div>
      ) : null}
    </GlassCard>
  )
}
