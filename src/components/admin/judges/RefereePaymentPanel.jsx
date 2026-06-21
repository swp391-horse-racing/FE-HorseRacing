import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Badge from '@/components/ui/Badge'
import { GlassCard, PrimaryButton } from '@/pages/admin/AdminLayout'
import { refereePaymentService, REFEREE_PAYOUTS_UPDATED_EVENT } from '@/services/refereePaymentService'
import {
  readRefereeFeeSettings,
  REFEREE_FEE_UPDATED_EVENT,
} from '@/services/refereeFeeSettingsService'
import { fmtVND } from '@/utils/formatCurrency'

function resolveAssignedRefereeId(race) {
  return race?.raw?.refereeId ?? race?.refereeId ?? null
}

export default function RefereePaymentPanel({ tournament, race, refereesById = new Map() }) {
  const [feeSettings, setFeeSettings] = useState(() => readRefereeFeeSettings())
  const [payout, setPayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const assignedRefereeId = useMemo(() => resolveAssignedRefereeId(race), [race])
  const assignedReferee = assignedRefereeId
    ? refereesById.get(String(assignedRefereeId))
    : null
  const assignedName =
    race?.raw?.refereeUsername ||
    race?.refereeName ||
    assignedReferee?.name ||
    payout?.refereeName ||
    ''

  const loadPayoutStatus = useCallback(async () => {
    if (!race?.id) {
      setPayout(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const status = await refereePaymentService.getRacePayoutStatus(race.id)
    setPayout(status)
    setLoading(false)
  }, [race?.id])

  useEffect(() => {
    loadPayoutStatus()
  }, [loadPayoutStatus, assignedRefereeId])

  useEffect(() => {
    const handleFeeUpdated = () => setFeeSettings(readRefereeFeeSettings())
    const handlePayoutUpdated = () => loadPayoutStatus()

    window.addEventListener(REFEREE_FEE_UPDATED_EVENT, handleFeeUpdated)
    window.addEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handlePayoutUpdated)
    return () => {
      window.removeEventListener(REFEREE_FEE_UPDATED_EVENT, handleFeeUpdated)
      window.removeEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handlePayoutUpdated)
    }
  }, [loadPayoutStatus])

  const handlePay = async () => {
    if (!assignedRefereeId) {
      toast.error('Phải gửi phân công trọng tài trước khi thanh toán')
      return
    }

    if (payout?.paid) {
      toast.info('Cuộc đua này đã được thanh toán lương trọng tài')
      return
    }

    const amount = feeSettings.perRaceFee
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Hãy cấu hình mức lương trọng tài tại Cài đặt hệ thống')
      return
    }

    try {
      setPaying(true)
      const result = await refereePaymentService.payRefereeForRace(race.id, {
        refereeId: assignedRefereeId,
        amount,
        refereeName: assignedName,
        refereeEmail: assignedReferee?.email ?? '',
        race,
        tournament,
      })
      setPayout(result)
      toast.success(`Đã ghi nhận thanh toán ${fmtVND(amount)} cho trọng tài`)
    } catch {
      toast.error('Không thể ghi nhận thanh toán lương trọng tài')
    } finally {
      setPaying(false)
    }
  }

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <Banknote className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Thanh toán lương trọng tài</h2>
            <p className="text-xs text-white/50">
              {tournament.name} · {race.name}
            </p>
          </div>
        </div>
        <Link
          to="/admin/settings"
          className="text-xs font-semibold text-[#dda50e] hover:underline"
        >
          Cấu hình mức lương
        </Link>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/45">Mức lương cấu hình</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#dda50e]">
              {fmtVND(feeSettings.perRaceFee)}
            </p>
            <p className="mt-1 text-xs text-white/45">Theo cuộc đua / trọng tài chính</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/45">Trọng tài được giao</p>
            {assignedRefereeId ? (
              <>
                <p className="mt-2 text-lg font-semibold text-white">{assignedName || 'Trọng tài'}</p>
                <p className="mt-1 text-xs text-white/45">ID: {assignedRefereeId}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/45">
                Chưa có trọng tài trên hệ thống. Gửi phân công trước.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-white/70">
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin text-white/45" />
                Đang kiểm tra trạng thái...
              </>
            ) : payout?.paid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Đã thanh toán {fmtVND(payout.amount || feeSettings.perRaceFee)}
                {payout.paidAt ? ` · ${new Date(payout.paidAt).toLocaleString('vi-VN')}` : ''}
              </>
            ) : assignedRefereeId ? (
              <>Sẵn sàng ghi nhận thanh toán cho trọng tài</>
            ) : (
              <>Chưa thể thanh toán — cần phân công trọng tài trước</>
            )}
          </div>

          {payout?.paid ? (
            <Badge tone="green">Đã thanh toán</Badge>
          ) : (
            <Badge tone="gold">Chưa thanh toán</Badge>
          )}
        </div>

        <p className="text-xs text-white/40">
          Trọng tài xem khoản đã nhận tại mục Ví của tôi → Lương & phụ cấp.
        </p>

        <div className="flex justify-end">
          <PrimaryButton
            icon={Banknote}
            disabled={paying || loading || !assignedRefereeId || payout?.paid}
            onClick={handlePay}
          >
            {paying
              ? 'Đang xử lý...'
              : payout?.paid
                ? 'Đã thanh toán'
                : `Thanh toán ${fmtVND(feeSettings.perRaceFee)}`}
          </PrimaryButton>
        </div>
      </div>
    </GlassCard>
  )
}
