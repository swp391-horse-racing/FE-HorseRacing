import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Card from '@/components/ui/Card'
import {
  refereePaymentService,
  REFEREE_PAYOUTS_UPDATED_EVENT,
} from '@/services/refereePaymentService'
import { fmtVND } from '@/utils/formatCurrency'
import { formatDisplayDate } from '@/utils/dateFormat'

export default function RefereeSalaryPanel() {
  const user = useAuthStore((state) => state.user)
  const [payouts, setPayouts] = useState([])

  useEffect(() => {
    const load = () => setPayouts(refereePaymentService.getRefereePayoutsForUser(user))
    load()
    window.addEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, load)
    return () => window.removeEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, load)
  }, [user])

  const total = payouts.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Banknote className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">Lương & phụ cấp đã nhận</h2>
            <p className="text-sm text-white/50">Admin thanh toán sau khi cuộc đua kết thúc và chốt kết quả</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-white/45">Tổng đã nhận</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-300">{fmtVND(total)}</p>
        </div>
      </div>

      {payouts.length ? (
        <div className="divide-y divide-white/5">
          {payouts.map((item) => (
            <div
              key={`${item.raceId}-${item.paidAt}`}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div>
                <p className="font-semibold text-white">{item.raceName || `Cuộc đua #${item.raceId}`}</p>
                <p className="text-sm text-white/50">{item.tournamentName || 'Giải đấu'}</p>
                <p className="mt-1 text-xs text-white/40">
                  {formatDisplayDate(item.paidAt?.slice(0, 10), '—')}
                  {item.paidAt ? ` · ${new Date(item.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tabular-nums text-emerald-300">
                  +{fmtVND(item.amount)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã nhận
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center text-sm text-white/45">
          Chưa có khoản lương/phụ cấp nào. Admin sẽ thanh toán sau khi bạn chốt kết quả cuộc đua.
        </div>
      )}
    </Card>
  )
}
