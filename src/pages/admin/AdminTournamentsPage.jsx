import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Flag,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { PrimaryLink } from "@/components/admin/ui/AdminButton";
import { tournamentApi } from "@/api/tournamentApi";

const statusTabs = [
  "Tất cả",
  "Nháp",
  "Đang mở đăng ký",
  "Đang diễn ra",
  "Đã kết thúc",
];

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [view, setView] = useState("grid");

  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true);
        const data = await tournamentApi.list();
        setTournaments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách giải đấu");
      } finally {
        setLoading(false);
      }
    }

    loadTournaments();
  }, []);

  const counts = useMemo(
    () =>
      statusTabs.reduce((result, tab) => {
        result[tab] =
          tab === "Tất cả"
            ? tournaments.length
            : tournaments.filter((item) => item.status === tab).length;
        return result;
      }, {}),
    [tournaments],
  );

  const visibleTournaments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = tournaments.filter((item) => {
      const matchesStatus = status === "Tất cả" || item.status === status;
      const matchesSearch =
        !normalizedQuery ||
        `${item.name} ${item.location} ${item.description || ""}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesStatus && matchesSearch;
    });

    return filtered.toSorted((first, second) => {
      if (sortBy === "name") return first.name.localeCompare(second.name, "vi");
      const order = sortBy === "oldest" ? 1 : -1;
      return (
        order *
        String(first.startDate || "").localeCompare(
          String(second.startDate || ""),
        )
      );
    });
  }, [query, sortBy, status, tournaments]);

  return (
    <AdminLayout
      heading="Quản lý"
      highlight="Giải đấu"
      subtitle="Tạo, cấu hình và theo dõi các giải đua ngựa"
      action={
        <PrimaryLink to="/admin/tournaments/new" icon={Plus} size="lg">
          Tạo giải đấu
        </PrimaryLink>
      }
    >
      <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
        <div className="flex flex-wrap gap-3 border-b border-white/10 px-7 py-7">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`inline-flex h-14 items-center gap-4 rounded-2xl px-7 font-semibold transition ${status === tab ? "bg-[#dda50e] text-white shadow-lg shadow-[#d4a017]/30" : "bg-white/[0.06] text-white/60 hover:text-white"}`}
            >
              {tab}
              <span
                className={`rounded-full px-3 py-1 text-sm ${status === tab ? "bg-white/20" : "bg-white/10"}`}
              >
                {counts[tab] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5 px-7 py-7 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-white/45" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc địa điểm..."
              className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-16 pr-5 text-lg text-white outline-none placeholder:text-white/35 focus:border-[#dda50e]/60"
            />
          </label>
          <label className="relative lg:w-64">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-16 w-full appearance-none rounded-2xl border border-white/10 bg-[#162338] px-7 pr-14 text-lg font-semibold text-white outline-none focus:border-[#dda50e]/60"
            >
              <option value="latest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Theo tên</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
          </label>
          <div className="flex h-16 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            <ViewButton
              label="Dạng thẻ"
              active={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-6 w-6" />
            </ViewButton>
            <ViewButton
              label="Dạng danh sách"
              active={view === "list"}
              onClick={() => setView("list")}
            >
              <List className="h-6 w-6" />
            </ViewButton>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center text-white/45">
          Đang tải dữ liệu...
        </div>
      ) : visibleTournaments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center text-white/45">
          <Trophy className="mx-auto mb-4 h-12 w-12" />
          Không có giải đấu nào phù hợp.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {visibleTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <TournamentTable tournaments={visibleTournaments} />
      )}
    </AdminLayout>
  );
}

function ViewButton({ active, children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-12 w-14 items-center justify-center rounded-xl transition ${active ? "bg-[#dda50e] text-white" : "text-white/55 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const tones = {
    "Đang mở đăng ký": "border-[#dda50e]/40 bg-[#dda50e]/15 text-[#efbb2c]",
    "Đang diễn ra": "border-emerald-400/35 bg-emerald-500/15 text-emerald-300",
    "Đã kết thúc": "border-purple-400/35 bg-purple-500/15 text-purple-300",
    Nháp: "border-white/20 bg-white/10 text-white/65",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${tones[status] || tones.Nháp}`}
    >
      {status}
    </span>
  );
}

function TournamentCard({ tournament }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
      <div className="relative h-60 overflow-hidden">
        <img
          src={
            tournament.banner ||
            "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
          }
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111d32] via-transparent to-transparent" />
        <div className="absolute left-5 top-5">
          <StatusBadge status={tournament.status} />
        </div>
        <h2 className="absolute bottom-5 left-5 right-5 truncate text-2xl font-bold">
          {tournament.name}
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-b border-white/10 pb-6 text-base text-white/60">
          <CardMeta icon={MapPin} text={tournament.location} />
          <CardMeta
            icon={CalendarDays}
            text={formatDate(tournament.startDate)}
          />
          <CardMeta
            icon={Flag}
            text={`${tournament.raceCount || 0} cuộc đua`}
          />
          <CardMeta
            icon={Trophy}
            text={`${tournament.registrationCount || 0} đăng ký`}
          />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Link
            to={`/admin/tournaments/${tournament.id}`}
            className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-[#dda50e] font-semibold shadow-lg shadow-[#d4a017]/20 transition hover:bg-[#c8940f]"
          >
            <Settings className="h-5 w-5" />
            Quản lý
          </Link>
          <ActionButton label="Chỉnh sửa">
            <Pencil className="h-5 w-5" />
          </ActionButton>
          <ActionButton label="Xóa giải đấu">
            <Trash2 className="h-5 w-5" />
          </ActionButton>
        </div>
      </div>
    </article>
  );
}

function TournamentTable({ tournaments }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
      <table className="w-full min-w-[920px]">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/45">
            <th className="px-6 py-4">Giải đấu</th>
            <th className="px-6 py-4">Trạng thái</th>
            <th className="px-6 py-4">Địa điểm</th>
            <th className="px-6 py-4">Ngày bắt đầu</th>
            <th className="px-6 py-4">Cuộc đua</th>
            <th className="px-6 py-4">Đăng ký</th>
            <th className="px-6 py-4">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((tournament) => (
            <tr
              key={tournament.id}
              className="border-b border-white/5 text-sm text-white/75"
            >
              <td className="px-6 py-4 font-semibold text-white">
                {tournament.name}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={tournament.status} />
              </td>
              <td className="px-6 py-4">{tournament.location}</td>
              <td className="px-6 py-4">{formatDate(tournament.startDate)}</td>
              <td className="px-6 py-4">{tournament.raceCount || 0}</td>
              <td className="px-6 py-4">{tournament.registrationCount || 0}</td>
              <td className="px-6 py-4">
                <Link
                  to={`/admin/tournaments/${tournament.id}`}
                  className="font-semibold text-[#dda50e] hover:text-[#ebbc37]"
                >
                  Quản lý
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardMeta({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#dda50e]" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function ActionButton({ children, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#dda50e]/40 hover:text-[#dda50e]"
    >
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
}
