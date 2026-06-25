import {
  BadgePercent,
  Gavel,
  LayoutDashboard,
  Newspaper,
  PawPrint,
  Settings,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'

export const ADMIN_NAV = [
  { label: 'Tong quan', to: '/admin', icon: LayoutDashboard },
  { label: 'Giai dau', to: '/admin/tournaments', icon: Trophy },
  { label: 'Phan cong trong tai', to: '/admin/judges', icon: Gavel },
  { label: 'Tin tuc', to: '/admin/news', icon: Newspaper },
  { label: 'Nguoi dung', to: '/admin/users', icon: Users },
  { label: 'Ngua', to: '/admin/horses', icon: PawPrint },
  { label: 'Vi he thong', to: '/admin/wallet', icon: Wallet },
  { label: 'Cai dat', to: '/admin/settings', icon: Settings },
  { label: 'Cau hinh cuoc race', to: '/admin/bet-markets', icon: BadgePercent },
]
