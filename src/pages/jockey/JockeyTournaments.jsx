import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Flag,
  MapPin,
  RefreshCw,
  Search,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { tournamentService } from "@/services/tournamentService";
import { GlassCard, GhostButton, Pill } from "../admin/AdminLayout";
import { JockeyLayout } from "./JockeyLayout";
import { invitations, schedules, fmt } from "./data";
import { JockeyInfoRow } from "./components/JockeyInfoRow";

const FALLBACK_TOURNAMENT_IMAGE =
  "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

const DEFAULT_STATUS_FILTERS = [
  "Tất cả",
  "Đã công bố",
  "Đang mở đăng ký",
  "Đã đóng đăng ký",
  "Đã lên lịch",
  "Đang diễn ra",
  "Đã kết thúc",
];

function formatDate(value) {
  return value || "-";
}

function formatCapacity(tournament) {
  const maxHorses = Number(tournament.maxHorses ?? 0);
  const registeredHorses = Number(tournament.registeredHorses ?? 0);
  return maxHorses > 0
    ? `${registeredHorses} / ${maxHorses} đăng ký`
    : `${registeredHorses} đăng ký`;
}

function getJockeyRelation(tournament) {
  const assignedSchedule = schedules.find(
    (schedule) => schedule.tournament === tournament.name,
  );
  if (assignedSchedule) {
    return {
      label: `Đã có lịch`,
      tone: assignedSchedule.checkedIn ? "green" : assignedSchedule.statusTone,
      detail: assignedSchedule.race,
    };
  }

  const invitation = invitations.find(
    (item) => item.tournament === tournament.name,
  );
  if (invitation) {
    return {
      label: "Có lời mời",
      tone: invitation.statusTone,
      detail: invitation.status,
    };
  }

  return {
    label: "Theo dõi",
    tone: "gray",
    detail: "Chưa có lịch/lời mời",
  };
}

export function JockeyTournaments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [detail, setDetail] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTournaments() {
      try {
        setLoading(true);
        setError("");
        const response = await tournamentService.getPublicTournaments();
        if (!cancelled) setTournaments(response.data);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Không thể tải danh sách giải đấu.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTournaments();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusFilters = useMemo(() => {
    const usedStatuses = new Set(tournaments.map((tournament) => tournament.status));
    return DEFAULT_STATUS_FILTERS.filter(
      (status) => status === "Tất cả" || usedStatuses.has(status),
    );
  }, [tournaments]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi");

    return tournaments.filter(
      (tournament) =>
        (statusFilter === "Tất cả" || tournament.status === statusFilter) &&
        (!normalizedSearch ||
          `${tournament.name} ${tournament.location}`
            .toLocaleLowerCase("vi")
            .includes(normalizedSearch)),
    );
  }, [search, statusFilter, tournaments]);

  return (
    <JockeyLayout
      title="Jockey · Giải đấu"
      subtitle="Danh sách giải đấu, race và trạng thái liên quan đến bạn"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm giải đấu, địa điểm..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#D4A017]/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {statusFilters.map((status) => {
          const count =
            status === "Tất cả"
              ? tournaments.length
              : tournaments.filter((tournament) => tournament.status === status).length;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                statusFilter === status
                  ? "bg-[#D4A017] text-white shadow-lg shadow-[#D4A017]/25"
                  : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  statusFilter === status ? "bg-white/20" : "bg-white/10"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <GlassCard className="flex items-center justify-center gap-3 p-10 text-white/60">
          <RefreshCw className="h-5 w-5 animate-spin text-[#D4A017]" />
          Đang tải danh sách giải đấu...
        </GlassCard>
      ) : error ? (
        <GlassCard className="border-red-500/20 bg-red-500/10 p-10 text-center text-red-200">
          {error}
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/50">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-white/30" />
          Không có giải đấu nào phù hợp.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tournament) => {
            const relation = getJockeyRelation(tournament);

            return (
              <GlassCard key={tournament.id} className="overflow-hidden">
                <div className="relative h-36 overflow-hidden bg-[#0F1E3A]">
                  <img
                    src={tournament.banner}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_TOURNAMENT_IMAGE;
                    }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <Pill tone={tournament.statusTone}>{tournament.status}</Pill>
                    <Pill tone={relation.tone}>{relation.label}</Pill>
                  </div>
                  <div className="absolute bottom-3 right-3 text-right">
                    <div className="text-[10px] text-white/60">Prize Pool</div>
                    <div className="text-sm font-bold text-[#D4A017]">
                      {fmt(tournament.prizePool)}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="mb-1 line-clamp-1 text-base font-bold text-white">
                    {tournament.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 min-h-8 text-xs text-white/50">
                    {tournament.description}
                  </p>

                  <div className="mb-4 space-y-2">
                    <JockeyInfoRow
                      icon={MapPin}
                      text={tournament.location || "Chưa cập nhật địa điểm"}
                    />
                    <JockeyInfoRow
                      icon={Calendar}
                      text={`${formatDate(tournament.startDate)} → ${formatDate(
                        tournament.endDate,
                      )}`}
                    />
                    <JockeyInfoRow
                      icon={Clock}
                      text={`Hạn đăng ký: ${formatDate(tournament.deadline)}`}
                      highlight
                    />
                    <JockeyInfoRow
                      icon={DollarSign}
                      text={`Entry fee: ${fmt(tournament.entryFee)}`}
                    />
                    <JockeyInfoRow
                      icon={Users}
                      text={formatCapacity(tournament)}
                    />
                    <JockeyInfoRow icon={Flag} text={relation.detail} />
                  </div>

                  <GhostButton
                    icon={Eye}
                    className="w-full"
                    onClick={() => setDetail(tournament)}
                  >
                    Chi tiết
                  </GhostButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {detail && (
        <TournamentDetailModal
          tournament={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </JockeyLayout>
  );
}

function TournamentDetailModal({ tournament, onClose }) {
  const relation = getJockeyRelation(tournament);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4A017]/15">
              <Trophy className="h-4 w-4 text-[#D4A017]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-white">
                {tournament.name}
              </h2>
              <p className="truncate text-xs text-white/50">
                {tournament.location || "Chưa cập nhật địa điểm"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <DetailStat
              label="Prize Pool"
              value={fmt(tournament.prizePool)}
              tone="gold"
            />
            <DetailStat
              label="Entry Fee"
              value={fmt(tournament.entryFee)}
              tone="blue"
            />
            <DetailStat
              label="Đăng ký"
              value={
                Number(tournament.maxHorses ?? 0) > 0
                  ? `${tournament.registeredHorses}/${tournament.maxHorses}`
                  : String(tournament.registeredHorses ?? 0)
              }
              tone="green"
            />
            <DetailStat label="Trạng thái" value={tournament.status} tone={tournament.statusTone} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Flag className="h-4 w-4 text-[#D4A017]" />
                Trạng thái của bạn
              </div>
              <Pill tone={relation.tone}>{relation.label}</Pill>
            </div>
            <p className="text-sm text-white/55">{relation.detail}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <Flag className="h-4 w-4 text-[#D4A017]" />
              Race trong giải
            </div>
            <div className="space-y-2">
              {tournament.races.length === 0 ? (
                <p className="text-sm text-white/45">
                  Chưa có race được công bố.
                </p>
              ) : (
                tournament.races.map((race) => (
                  <div
                    key={race.id}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {race.name}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          {formatDate(race.date)} · {race.time || "--:--"} ·{" "}
                          {race.distance || "Chưa cập nhật cự ly"}
                        </div>
                      </div>
                      <Pill tone="blue">{race.status}</Pill>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function DetailStat({ label, value, tone }) {
  const tones = {
    gold: "text-[#D4A017]",
    green: "text-emerald-300",
    blue: "text-sky-300",
    purple: "text-purple-300",
    gray: "text-white",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className={`text-sm font-bold ${tones[tone] ?? "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
