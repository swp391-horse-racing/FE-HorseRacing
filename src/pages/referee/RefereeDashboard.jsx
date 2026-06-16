import { Link } from 'react-router-dom';
import {
  Flag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  Users,
  ArrowRight,
  Bell,
  Activity,
  Zap,
  Gavel,
  ClipboardCheck,
  Calendar,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { RefereeLayout } from './RefereeLayout';
import { GlassCard, StatCard, Pill, PrimaryButton, GhostButton } from '../admin/AdminLayout';
import { violations, notifications, raceStatusTone } from './data';
import { useAssignedRaces } from './useAssignedRaces';

export function RefereeDashboard() {
  const assignedRaces = useAssignedRaces();
  const today = new Date().toISOString().slice(0, 10);
  const todayRaces = assignedRaces.filter((r) => r.date === today);
  const upcoming = assignedRaces.filter((r) => r.status === 'Sắp diễn ra' || r.status === 'Đang check-in');
  const completed = assignedRaces.filter((r) => r.status === 'Đã kết thúc');
  const totalCheckedIn = assignedRaces.reduce((s, r) => s + r.checkedIn, 0);
  const pendingCheckins = assignedRaces
    .filter((r) => r.status === 'Đang check-in' || r.status === 'Sắp diễn ra')
    .reduce((s, r) => s + (r.totalHorses - r.checkedIn), 0);
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const activeRace =
    assignedRaces.find((race) => race.status === 'Đang check-in' || race.status === 'Đang đua') ??
    upcoming[0] ??
    assignedRaces[0];

  return (
    <RefereeLayout
      title="Trọng tài · Tổng quan"
      subtitle={`Bạn có ${assignedRaces.length} cuộc đua được phân công · ${todayRaces.length} cuộc hôm nay`}
      actions={
        <>
          <Link to="/referee/races">
            <GhostButton icon={Flag}>Xem tất cả race</GhostButton>
          </Link>
          {activeRace ? (
            <Link to={`/referee/races/${activeRace.id}`}>
              <PrimaryButton icon={Zap}>Vào race được giao</PrimaryButton>
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Race hôm nay" value={String(todayRaces.length)} icon={Flag} tone="gold" delta={`+${upcoming.length} sắp tới`} />
        <StatCard label="Đã check-in" value={String(totalCheckedIn)} icon={CheckCircle2} tone="green" />
        <StatCard label="Chờ check-in" value={String(pendingCheckins)} icon={Clock} tone="blue" />
        <StatCard label="Vi phạm tuần này" value={String(violations.length)} icon={AlertTriangle} tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4A017]/15 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Lịch race hôm nay</h2>
                  <p className="text-xs text-white/50">{today} · Phú Thọ Racecourse</p>
                </div>
              </div>
              <Link to="/referee/races" className="text-xs text-[#D4A017] hover:underline font-semibold flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {todayRaces.length === 0 && (
                <div className="text-center text-white/40 py-8 text-sm">Hôm nay không có race nào được giao.</div>
              )}
              {todayRaces.map((r) => {
                const pct = Math.round((r.checkedIn / r.totalHorses) * 100);
                return (
                  <Link
                    key={r.id}
                    to={`/referee/races/${r.id}`}
                    className="block p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:border-[#D4A017]/40 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center shrink-0 w-16">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Giờ</div>
                        <div className="text-xl font-bold text-[#D4A017]">{r.time}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#D4A017] bg-[#D4A017]/15 px-2 py-0.5 rounded-md border border-[#D4A017]/30">
                            R{r.no}
                          </span>
                          <h3 className="font-bold text-white text-sm truncate">{r.name}</h3>
                          <Pill tone={raceStatusTone(r.status)}>{r.status}</Pill>
                        </div>
                        <div className="text-[11px] text-white/50 truncate">
                          {r.tournamentName} · {r.distance} · {r.surface} · {r.track}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#D4A017] to-[#E5B82F]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-white/60 font-mono shrink-0">
                            {r.checkedIn}/{r.totalHorses} check-in
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#D4A017] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Race timeline · 24h</h2>
                <p className="text-xs text-white/50">Hoạt động trọng tài gần nhất</p>
              </div>
            </div>
            <div className="p-5">
              <div className="relative pl-6 border-l-2 border-white/10 space-y-5">
                {[
                  { icon: CheckCircle2, color: 'emerald', text: 'Xác nhận kết quả Race R2 Saigon Derby', time: '08:12' },
                  { icon: AlertTriangle, color: 'red', text: 'Ghi nhận vi phạm "Lái nguy hiểm" · ngựa #5 Storm Chaser', time: 'Hôm qua 15:48' },
                  { icon: ClipboardCheck, color: 'gold', text: 'Check-in 12/12 ngựa Race R2 Saigon Derby', time: 'Hôm qua 14:50' },
                  { icon: Gavel, color: 'blue', text: 'Được phân công Race R3 (Bán kết) Vietnam GP', time: 'Hôm qua 09:30' },
                ].map((e, i) => {
                  const Icon = e.icon;
                  const map = {
                    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    red: 'bg-red-500/15 text-red-300 border-red-500/30',
                    gold: 'bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/30',
                    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                  };
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[34px] w-7 h-7 rounded-full border flex items-center justify-center ${map[e.color]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-sm text-white/90">{e.text}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{e.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-5 bg-gradient-to-br from-[#D4A017]/15 to-transparent border-[#D4A017]/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#D4A017]" />
              <h3 className="text-sm font-bold text-white">Thao tác nhanh</h3>
            </div>
            <div className="space-y-2">
              {activeRace ? (
                <QuickAction
                  to={`/referee/races/${activeRace.id}`}
                  icon={ClipboardCheck}
                  label="Check-in race được giao"
                  sub={`${activeRace.tournamentName} · R${activeRace.no} · ${activeRace.time}`}
                />
              ) : null}
              <QuickAction to="/referee/violations" icon={AlertTriangle} label="Ghi nhận vi phạm" sub="Mở form ghi nhận mới" />
              <QuickAction to="/referee/history" icon={Trophy} label="Nhập kết quả race" sub="Sau khi race kết thúc" />
              <QuickAction to="/referee/races" icon={Flag} label="Danh sách race" sub={`${assignedRaces.length} race được giao`} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center relative">
                  <Bell className="w-5 h-5 text-red-300" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Thông báo</h3>
                  <p className="text-[11px] text-white/50">{unreadNotifs} chưa đọc</p>
                </div>
              </div>
              <Link to="/referee/notifications" className="text-xs text-[#D4A017] hover:underline font-semibold">
                Tất cả
              </Link>
            </div>
            <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to={n.link ?? '/referee/notifications'}
                  className={`block p-3 rounded-xl transition-all ${
                    n.read ? 'hover:bg-white/5' : 'bg-[#D4A017]/5 hover:bg-[#D4A017]/10 border border-[#D4A017]/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 bg-[#D4A017] rounded-full mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                      <div className="text-[11px] text-white/50 line-clamp-2">{n.body}</div>
                      <div className="text-[10px] text-white/40 mt-1">{n.time}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#D4A017]" />
              <h3 className="text-sm font-bold text-white">Sân đua hôm nay</h3>
            </div>
            <div className="text-xs space-y-2">
              <Row k="Sân" v="Phú Thọ Racecourse" />
              <Row k="Thời tiết" v="Nắng · 28°C · Gió 8km/h" />
              <Row k="Mặt sân" v="Cỏ tốt · Đất khô" />
              <Row k="Camera" v="12/12 hoạt động" />
              <Row k="Y tế" v="Sẵn sàng · 2 BS thú y" />
            </div>
          </GlassCard>
        </div>
      </div>
    </RefereeLayout>
  );
}

function QuickAction({ to, icon: Icon, label, sub }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all group"
    >
      <div className="w-9 h-9 bg-[#D4A017]/15 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#D4A017]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{label}</div>
        <div className="text-[11px] text-white/50 truncate">{sub}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#D4A017] group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/50">{k}</span>
      <span className="text-white font-semibold text-right">{v}</span>
    </div>
  );
}
