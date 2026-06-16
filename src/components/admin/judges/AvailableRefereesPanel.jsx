import { Plus, UserCheck } from 'lucide-react'
import { GlassCard } from '@/pages/admin/AdminLayout'
import { refereeInitial } from '@/data/adminJudgeMock'

export default function AvailableRefereesPanel({
  referees = [],
  loading = false,
  error = '',
  assignedIds,
  onAdd,
}) {  const available = referees.filter((referee) => !assignedIds.has(referee.id))

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-[#D4A017]" />
          <div>
            <h3 className="font-bold text-white">Trọng tài khả dụng</h3>
            <p className="text-xs text-white/50">
              {loading
                ? 'Đang tải trọng tài từ hệ thống...'
                : `${available.length} trọng tài chưa được phân công`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40 sm:col-span-2">
            Đang tải danh sách trọng tài...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] p-6 text-center text-xs text-rose-200 sm:col-span-2">
            {error}
          </div>
        ) : available.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40 sm:col-span-2">
            {referees.length === 0
              ? 'Chưa có trọng tài hoạt động trong hệ thống.'
              : 'Tất cả trọng tài đã được phân công cho cuộc đua này.'}
          </div>
        ) : (
          available.map((referee) => (
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
                </div>
                <div className="truncate text-[10px] text-white/40">
                  {referee.experience > 0 ? `${referee.experience} năm` : 'Chưa có kinh nghiệm'} ·{' '}
                  {referee.specialty}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAdd(referee.id)}
                className="shrink-0 rounded-lg p-2 text-emerald-300/80 transition-all hover:bg-emerald-500/10 hover:text-emerald-300"
                title="Thêm vào tổ trọng tài"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}
