import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { fmtVND } from '@/utils/formatCurrency'
import { walletService, peekWalletBalance, invalidateWalletCache } from '@/services/walletService'
import {
  refereePaymentService,
  REFEREE_PAYOUTS_UPDATED_EVENT,
} from '@/services/refereePaymentService'
import { useAuthStore } from '@/store/authStore'

/**
 * Badge ví trên header — có thể cộng thêm lương trọng tài đã nhận (localStorage).
 */
export default function RoleWalletBadge({
  to,
  walletMode = 'user',
  theme = 'dark',
  includeRefereeSalary = false,
}) {
  const user = useAuthStore((state) => state.user)
  const [walletBalance, setWalletBalance] = useState(() => peekWalletBalance(walletMode) ?? 0)
  const [salaryBalance, setSalaryBalance] = useState(() =>
    includeRefereeSalary ? refereePaymentService.getRefereePayoutTotal(user) : 0,
  )

  useEffect(() => {
    const loadWallet = walletMode === 'admin' ? walletService.getAdminWallet : walletService.getMyWallet
    loadWallet()
      .then((w) => setWalletBalance(w?.availableBalance ?? w?.totalBalance ?? 0))
      .catch(() => setWalletBalance(0))
  }, [walletMode])

  useEffect(() => {
    if (!includeRefereeSalary) return undefined

    const refreshSalary = () => setSalaryBalance(refereePaymentService.getRefereePayoutTotal(user))
    refreshSalary()
    window.addEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, refreshSalary)
    return () => window.removeEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, refreshSalary)
  }, [includeRefereeSalary, user])

  useEffect(() => {
    if (!includeRefereeSalary) return undefined

    const handleWalletRefresh = () => {
      invalidateWalletCache('user')
      walletService
        .getMyWallet()
        .then((w) => setWalletBalance(w?.availableBalance ?? w?.totalBalance ?? 0))
        .catch(() => {})
    }
    window.addEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handleWalletRefresh)
    return () => window.removeEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handleWalletRefresh)
  }, [includeRefereeSalary])

  const balance = Number(walletBalance ?? 0) + Number(includeRefereeSalary ? salaryBalance : 0)
  const isDark = theme === 'dark'

  return (
    <Link
      to={to}
      title={includeRefereeSalary && salaryBalance > 0 ? 'Ví + lương trọng tài đã nhận' : 'Mở ví'}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        isDark
          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
          : 'bg-[#FFF8F0] hover:bg-[#FFF1DC] border-[#D4A017]/30 text-[#1E3A5F]'
      }`}
    >
      <Wallet className="w-4 h-4 text-[#D4A017] shrink-0" />
      <span className="text-sm font-bold text-[#D4A017] whitespace-nowrap">
        <span className={`font-normal mr-1 ${isDark ? 'text-white/50' : 'text-[#1E3A5F]/50'}`}>
          ví
        </span>
        {fmtVND(balance)}
      </span>
    </Link>
  )
}
