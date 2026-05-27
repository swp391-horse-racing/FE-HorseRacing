import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Filter,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentApi } from "@/api/tournamentApi";

const statusTabs = [
  "Tất cả",
  "Nháp",
  "Đang mở đăng ký",
  "Đang diễn ra",
  "Đã kết thúc",
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Tất cả");
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tournaments.filter((item) => {
      const matchesStatus = status === "Tất cả" || item.status === status;
      const matchesSearch =
        !keyword ||
        `${item.name} ${item.location} ${item.description || ""}`
          .toLowerCase()
          .includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [search, status, tournaments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-white to-[#FAFAFA] pt-24">
      <section className="border-b border-[#1E3A5F]/10 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4A017]/20 bg-[#D4A017]/10 px-4 py-2 text-sm font-semibold text-[#D4A017]">
              <Trophy className="h-4 w-4" /> Giải đấu
            </div>
            <h1 className="text-4xl font-bold text-[#1E3A5F] md:text-6xl">
              Danh sách giải đua ngựa
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#1E3A5F]/60">
              Xem giải đấu, cấu hình cơ bản, đăng ký tham gia và theo dõi kết
              quả cuộc đua.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-[#1E3A5F]/10 bg-white p-4 shadow-lg shadow-[#1E3A5F]/5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl border border-[#1E3A5F]/10 px-4 py-3">
                <Filter className="h-5 w-5 text-[#D4A017]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full outline-none"
                  placeholder="Tìm theo tên, địa điểm..."
                />
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-2xl border border-[#1E3A5F]/10 px-4 py-3 font-semibold text-[#1E3A5F] outline-none"
              >
                {statusTabs.map((tab) => (
                  <option key={tab}>{tab}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#1E3A5F]/15 bg-white p-16 text-center text-[#1E3A5F]/55">
            Đang tải giải đấu...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1E3A5F]/15 bg-white p-16 text-center text-[#1E3A5F]/55">
            Không tìm thấy giải đấu phù hợp.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tournament) => (
              <article
                key={tournament.id}
                className="overflow-hidden rounded-3xl border border-[#1E3A5F]/10 bg-white shadow-xl shadow-[#1E3A5F]/5"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      tournament.banner ||
                      "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                    }
                    alt={tournament.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-[#D4A017] px-3 py-1 text-xs font-semibold text-white">
                    {tournament.status}
                  </span>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <h2 className="text-2xl font-bold">{tournament.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-white/75">
                      {tournament.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <Meta icon={MapPin} text={tournament.location} />
                  <Meta
                    icon={CalendarDays}
                    text={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
                  />
                  <Meta
                    icon={Users}
                    text={`${tournament.registrationCount || 0} đăng ký`}
                  />
                  <Meta
                    icon={Trophy}
                    text={`${tournament.raceCount || 0} cuộc đua`}
                  />
                  <div className="flex gap-3 pt-3">
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D4A017] px-4 py-3 font-semibold text-white transition hover:bg-[#B8941F]"
                    >
                      Chi tiết <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/tournaments/${tournament.id}/register`}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#1E3A5F]/15 px-4 py-3 font-semibold text-[#1E3A5F] transition hover:border-[#D4A017] hover:text-[#D4A017]"
                    >
                      Đăng ký
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Meta({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#1E3A5F]/65">
      <Icon className="h-4 w-4 text-[#D4A017]" />
      <span>{text}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
}
