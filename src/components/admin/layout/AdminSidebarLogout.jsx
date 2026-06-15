import { LogOut } from 'lucide-react'

export default function AdminSidebarLogout({ onLogout }) {
  return (
    <div className="shrink-0 border-t border-white/10 p-3">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </div>
  )
}
