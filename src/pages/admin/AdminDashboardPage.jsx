import {
  Activity,
  ArrowRight,
  CalendarDays,
  DollarSign,
  Flag,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";

const statistics = [
  {
    label: "Tổng giải đấu",
    value: "4",
    delta: "+12%",
    icon: Trophy,
    tone: "gold",
  },
  {
    label: "Tổng cuộc đua",
    value: "23",
    delta: "+8%",
    icon: Flag,
    tone: "blue",
  },
  {
    label: "Người tham gia",
    value: "160",
    delta: "+24%",
    icon: Users,
    tone: "green",
  },
  {
    label: "Doanh thu",
    value: "2.4 tỷ",
    delta: "+18%",
    icon: DollarSign,
    tone: "purple",
  },
];

const tournaments = [
  {
    id: "vietnam-grand-prix-2026",
    name: "Vietnam Grand Prix 2026",
    date: "2026-06-10",
    races: 6,
    image:
      "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=320",
  },
  {
    id: "saigon-derby-2026",
    name: "Saigon Derby 2026",
    date: "2026-07-15",
    races: 5,
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=320",
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminLayout
      action={
        <Link
          to="/admin/tournaments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#dda50e] px-5 py-3 font-semibold text-white shadow-lg shadow-[#d4a017]/20 transition hover:bg-[#c8940f]"
        >
          <Trophy className="h-5 w-5" />
          Tạo giải đấu mới
        </Link>
      }
    >
      <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mb-8 grid gap-7 xl:grid-cols-[2.1fr_1fr]">
        <GlassCard className="p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Doanh thu 6 tháng</h2>
              <p className="mt-1 text-base text-white/50">Đơn vị: triệu VNĐ</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              +18%
            </span>
          </div>
          <div className="h-60 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/55">
            Biểu đồ doanh thu mẫu
          </div>
        </GlassCard>
        <GlassCard className="p-7">
          <h2 className="mb-7 text-2xl font-bold">Số cuộc đua / Giải</h2>
          <div className="space-y-4">
            {["VGP 6", "SGD 5", "HNC 8", "SPC 4"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
      <GlassCard className="p-7">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="h-7 w-7 text-[#dda50e]" />
            <h2 className="text-2xl font-bold">Giải đấu nổi bật</h2>
          </div>
          <Link
            to="/admin/tournaments"
            className="flex items-center gap-2 font-semibold text-[#dda50e] transition hover:text-[#ebbc37]"
          >
            Xem tất cả
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/admin/tournaments/${tournament.id}`}
              className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-[#d4a017]/35 hover:bg-white/[0.05]"
            >
              <img
                src={tournament.image}
                alt=""
                className="h-16 w-24 rounded-xl border border-white/10 object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-xl font-bold">
                  {tournament.name}
                </span>
                <span className="mt-2 flex items-center gap-2 text-sm text-white/50">
                  <CalendarDays className="h-4 w-4" />
                  {tournament.date}
                  <span>·</span>
                  {tournament.races} cuộc đua
                </span>
              </span>
            </Link>
          ))}
        </div>
      </GlassCard>
    </AdminLayout>
  );
}
function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.045] ${className}`}
    >
      {children}
    </div>
  );
}
function StatCard({ icon: Icon, label, value, delta, tone }) {
  const tones = {
    gold: "border-[#dda50e]/25 bg-[#dda50e]/15 text-[#dda50e]",
    blue: "border-sky-400/25 bg-sky-400/15 text-sky-300",
    green: "border-emerald-400/25 bg-emerald-400/15 text-emerald-300",
    purple: "border-purple-400/25 bg-purple-400/15 text-purple-300",
  };
  return (
    <GlassCard className="p-7">
      <div className="mb-7 flex items-start justify-between">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${tones[tone]}`}
        >
          <Icon className="h-8 w-8" />
        </span>
        <span className="rounded-2xl bg-emerald-500/15 px-4 py-2 font-bold text-emerald-300">
          {delta}
        </span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="mt-2 text-base text-white/50">{label}</p>
    </GlassCard>
  );
}
