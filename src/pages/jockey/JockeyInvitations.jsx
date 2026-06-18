import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { jockeyService } from "@/services/jockeyService";
import { JockeyLayout } from "./JockeyLayout";
import { GlassCard, Pill, PrimaryButton } from "../admin/AdminLayout";
import { JockeyInfoRow } from "./components/JockeyInfoRow";

const STATUS_META = {
  PENDING: { label: "Chờ phản hồi", tone: "gold" },
  ACCEPTED: { label: "Đã nhận", tone: "green" },
  REJECTED: { label: "Từ chối", tone: "red" },
  CANCELLED: { label: "Đã hủy", tone: "gray" },
};

const FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ phản hồi" },
  { key: "ACCEPTED", label: "Đã nhận" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "CANCELLED", label: "Đã hủy" },
];

function statusMeta(statusCode) {
  return STATUS_META[statusCode] ?? { label: statusCode || "Không rõ", tone: "gray" };
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value, fallback = "Chưa cập nhật") {
  const date = parseDate(value);
  if (!date) return value || fallback;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(value, fallback = "--:--") {
  const raw = String(value ?? "");
  const match = raw.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];

  const date = parseDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTime(value, fallback = "Chưa cập nhật") {
  if (!value) return fallback;
  return `${formatDate(value, fallback)} · ${formatTime(value, "")}`.trim();
}

function formatRaceWindow(invitation) {
  const start = invitation.raceScheduledStartAt;
  const end = invitation.raceScheduledEndAt;

  if (!start || !end) return "Chưa có lịch race";

  return `${formatDate(start)} · ${formatTime(start)} - ${formatTime(end)}`;
}

function schedulesOverlap(first, second) {
  const firstStart = parseDate(first.raceScheduledStartAt);
  const firstEnd = parseDate(first.raceScheduledEndAt);
  const secondStart = parseDate(second.raceScheduledStartAt);
  const secondEnd = parseDate(second.raceScheduledEndAt);

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;
  return firstStart < secondEnd && firstEnd > secondStart;
}

function conflictReason(candidate, target) {
  if (!candidate || !target || String(candidate.id) === String(target.id)) return null;
  if (candidate.raceId && target.raceId && String(candidate.raceId) === String(target.raceId)) {
    return "Cùng cuộc đua";
  }
  if (schedulesOverlap(candidate, target)) {
    return "Trùng khung giờ";
  }
  return null;
}

function buildConflictMap(invitations) {
  return invitations.reduce((map, invitation) => {
    if (invitation.statusCode !== "PENDING") {
      map[invitation.id] = { pending: [], accepted: [] };
      return map;
    }

    const pending = [];
    const accepted = [];

    invitations.forEach((candidate) => {
      const reason = conflictReason(candidate, invitation);
      if (!reason) return;

      const item = { invitation: candidate, reason };
      if (candidate.statusCode === "PENDING") {
        pending.push(item);
      } else if (candidate.statusCode === "ACCEPTED") {
        accepted.push(item);
      }
    });

    map[invitation.id] = { pending, accepted };
    return map;
  }, {});
}

function ConflictBadge({ type, children }) {
  const classes =
    type === "danger"
      ? "border-red-400/40 bg-red-500/15 text-red-100"
      : "border-amber-300/45 bg-amber-400/15 text-amber-100";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function MiniInvitationRow({ item }) {
  const invitation = item.invitation;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {invitation.raceName || "Cuộc đua chưa cập nhật"}
          </p>
          <p className="truncate text-xs text-white/45">
            {invitation.horseName || "Ngựa chưa cập nhật"} · {invitation.ownerUsername || `Owner #${invitation.ownerId}`}
          </p>
        </div>
        <ConflictBadge>{item.reason}</ConflictBadge>
      </div>
      <div className="grid gap-1 text-xs text-white/55 sm:grid-cols-2">
        <span>{formatRaceWindow(invitation)}</span>
        <span>{invitation.remunerationText}</span>
      </div>
    </div>
  );
}

// Function to group pending invitations into conflict groups using BFS
function groupPendingInvitations(invitations) {
  const pendingInvs = invitations.filter((inv) => inv.statusCode === "PENDING");
  const visited = new Set();
  const groups = [];

  for (const inv of pendingInvs) {
    if (visited.has(inv.id)) continue;

    const group = [];
    const queue = [inv];
    visited.add(inv.id);

    while (queue.length > 0) {
      const current = queue.shift();
      group.push(current);

      for (const candidate of pendingInvs) {
        if (!visited.has(candidate.id)) {
          if (conflictReason(current, candidate)) {
            visited.add(candidate.id);
            queue.push(candidate);
          }
        }
      }
    }

    // Sort the group by remuneration amount descending so the highest is first
    group.sort((a, b) => (b.remunerationAmount || 0) - (a.remunerationAmount || 0));
    groups.push(group);
  }

  return groups;
}

// Sub-component for a single invitation card
function InvitationCard({ invitation, conflictMap, onAccept, onReject, savingId }) {
  const meta = statusMeta(invitation.statusCode);
  const conflicts = conflictMap[invitation.id] ?? { pending: [], accepted: [] };
  const hasPendingConflicts = conflicts.pending.length > 0;
  const hasAcceptedConflicts = conflicts.accepted.length > 0;

  return (
    <GlassCard
      className={[
        "overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/30",
        invitation.statusCode === "PENDING" ? "border-[#D4A017]/30" : "border-white/10",
        hasPendingConflicts ? "ring-1 ring-amber-300/25" : "",
        hasAcceptedConflicts ? "ring-1 ring-red-400/30" : "",
      ].join(" ")}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4A017]/20 bg-gradient-to-br from-[#D4A017]/20 to-[#0F1E3A]">
              <PawPrint className="h-6 w-6 text-[#D4A017]" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-white">
                {invitation.horseName || "Ngựa chưa cập nhật"}
              </h3>
              <p className="text-xs text-white/50">
                Từ chủ ngựa: {invitation.ownerUsername || `Owner #${invitation.ownerId}`}
              </p>
            </div>
          </div>
          <Pill tone={meta.tone}>{meta.label}</Pill>
        </div>

        {(hasPendingConflicts || hasAcceptedConflicts) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {hasPendingConflicts && (
              <ConflictBadge>
                Nhận lời mời này sẽ hủy {conflicts.pending.length} lời mời liên quan
              </ConflictBadge>
            )}
            {hasAcceptedConflicts && (
              <ConflictBadge type="danger">
                Đang trùng với lịch đã nhận
              </ConflictBadge>
            )}
          </div>
        )}

        <div className="mb-4 space-y-2.5">
          <JockeyInfoRow
            icon={Calendar}
            text={`Giải đấu: ${invitation.tournamentName || "Chưa cập nhật"}`}
          />
          <JockeyInfoRow
            icon={PawPrint}
            text={`Cuộc đua: ${invitation.raceName || "Chưa cập nhật"}`}
          />
          <JockeyInfoRow icon={Clock} text={`Lịch đua: ${formatRaceWindow(invitation)}`} />
          {(invitation.venueName || invitation.venueAddress) && (
            <JockeyInfoRow
              icon={MapPin}
              text={`Sân: ${[invitation.venueName, invitation.venueAddress].filter(Boolean).join(" · ")}`}
            />
          )}
          <JockeyInfoRow icon={User} text={`Mã owner: ${invitation.ownerId ?? "N/A"}`} />
          <JockeyInfoRow icon={Calendar} text={`Gửi lúc: ${formatDateTime(invitation.createdAt)}`} />
          <JockeyInfoRow
            icon={DollarSign}
            text={`Thù lao: ${invitation.remunerationText}`}
            highlight
          />
          {invitation.message && (
            <JockeyInfoRow icon={MessageSquare} text={invitation.message} />
          )}
          {invitation.responseNote && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white/55">
              Phản hồi: {invitation.responseNote}
            </div>
          )}
        </div>

        {hasPendingConflicts && (
          <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              Lời mời sẽ tự hủy nếu bạn chấp nhận
            </div>
            <div className="space-y-2">
              {conflicts.pending.slice(0, 2).map((item) => (
                <MiniInvitationRow key={item.invitation.id} item={item} />
              ))}
              {conflicts.pending.length > 2 && (
                <p className="text-xs text-white/45">
                  Và {conflicts.pending.length - 2} lời mời liên quan khác.
                </p>
              )}
            </div>
          </div>
        )}

        {invitation.statusCode === "PENDING" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onReject(invitation.id)}
              disabled={savingId === invitation.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Từ chối
            </button>
            <PrimaryButton
              icon={Check}
              className="flex-1"
              disabled={savingId === invitation.id || hasAcceptedConflicts}
              onClick={() => onAccept(invitation)}
            >
              Chấp nhận
            </PrimaryButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Sub-component for displaying groups of conflicting/overlapping invitations side-by-side
function InvitationComparisonGroup({ group, conflictMap, onAccept, onReject, savingId }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const highestRemuneration = Math.max(...group.map((inv) => inv.remunerationAmount || 0));

  const first = group[0];
  const allSameRace = group.every((inv) => inv.raceId && String(inv.raceId) === String(first.raceId));
  const allSameTournament = group.every((inv) => inv.tournamentId && String(inv.tournamentId) === String(first.tournamentId));

  // Compute the combined time range for the conflicting group
  const timeRangeText = useMemo(() => {
    let earliestStart = null;
    let latestEnd = null;

    group.forEach((inv) => {
      const start = parseDate(inv.raceScheduledStartAt);
      const end = parseDate(inv.raceScheduledEndAt);
      if (start && (!earliestStart || start < earliestStart)) earliestStart = start;
      if (end && (!latestEnd || end > latestEnd)) latestEnd = end;
    });

    if (!earliestStart || !latestEnd) return "Chưa cập nhật lịch";

    const isSameDay = earliestStart.toDateString() === latestEnd.toDateString();
    if (isSameDay) {
      return `${formatDate(earliestStart)} · ${formatTime(earliestStart)} - ${formatTime(latestEnd)}`;
    }
    return `${formatDate(earliestStart)} · ${formatTime(earliestStart)} - ${formatDate(latestEnd)} · ${formatTime(latestEnd)}`;
  }, [group]);

  return (
    <GlassCard className="col-span-full border-amber-500/30 bg-gradient-to-b from-[#14233C]/95 to-[#0B1526]/95 overflow-hidden ring-1 ring-amber-500/20 shadow-2xl">
      {/* Group Header */}
      <div className="border-b border-white/10 bg-amber-500/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-lg font-bold text-white truncate">
                So Sánh Lời Mời Trùng Lịch ({group.length} lời mời)
              </h3>
            </div>

            {/* Always visible quick summary badges */}
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-white/70">
                📅 Lịch: <strong className="text-white font-semibold">{timeRangeText}</strong>
              </span>
              {allSameRace && first.raceName && (
                <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-white/70">
                  🏁 Cuộc đua: <strong className="text-white font-semibold">{first.raceName}</strong>
                </span>
              )}
              {allSameTournament && first.tournamentName && (
                <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-white/70">
                  🏆 Giải: <strong className="text-white font-semibold">{first.tournamentName}</strong>
                </span>
              )}
              {!allSameRace && (
                <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-300 font-semibold">
                  ⚠️ Nhiều cuộc đua trùng giờ
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            {isExpanded ? (
              <>
                <span>Thu gọn</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Mở rộng</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        {isExpanded && (
          <p className="mt-3 text-xs text-white/50 border-t border-white/5 pt-3 leading-relaxed">
            Các lời mời này bị trùng lịch hoặc cùng cuộc đua. Bạn chỉ có thể chấp nhận tối đa 1 lời mời; các lời mời còn lại trong nhóm sẽ tự động hủy.
          </p>
        )}
      </div>

      {/* Grid of Invitations */}
      {isExpanded && (
        <div className="p-5 bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {group.map((invitation) => {
              const isHighest = invitation.remunerationAmount === highestRemuneration && highestRemuneration > 0;
              const conflicts = conflictMap[invitation.id] ?? { pending: [], accepted: [] };
              const hasAcceptedConflicts = conflicts.accepted.length > 0;

              return (
                <div
                  key={invitation.id}
                  className={[
                    "flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.04] relative",
                    isHighest
                      ? "border-emerald-500/35 bg-emerald-500/[0.02] shadow-lg shadow-emerald-950/10"
                      : "border-white/10 bg-white/[0.02]",
                    hasAcceptedConflicts ? "opacity-75" : "",
                  ].join(" ")}
                >
                  {/* Highlight highest reward */}
                  {isHighest && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20">
                        ✨ Thù lao tốt nhất
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    {/* Horse & Owner Header */}
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4A017]/25 bg-gradient-to-br from-[#D4A017]/15 to-[#0F1E3A]">
                        <PawPrint className="h-4.5 w-4.5 text-[#D4A017]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">
                          {invitation.horseName || "Ngựa chưa cập nhật"}
                        </h4>
                        <p className="truncate text-[11px] text-white/50">
                          Chủ: {invitation.ownerUsername || `Owner #${invitation.ownerId}`}
                        </p>
                      </div>
                    </div>

                    {/* Invitation Fields */}
                    <div className="mb-4 space-y-2 border-t border-white/5 pt-3 text-xs text-white/70">
                      <JockeyInfoRow
                        icon={Calendar}
                        text={`Giải đấu: ${invitation.tournamentName || "Chưa cập nhật"}`}
                      />
                      <JockeyInfoRow
                        icon={PawPrint}
                        text={`Cuộc đua: ${invitation.raceName || "Chưa cập nhật"}`}
                      />
                      <JockeyInfoRow icon={Clock} text={`Lịch đua: ${formatRaceWindow(invitation)}`} />
                      {(invitation.venueName || invitation.venueAddress) && (
                        <JockeyInfoRow
                          icon={MapPin}
                          text={`Sân: ${[invitation.venueName, invitation.venueAddress].filter(Boolean).join(" · ")}`}
                        />
                      )}
                      <JockeyInfoRow icon={User} text={`Mã owner: ${invitation.ownerId ?? "N/A"}`} />
                      <JockeyInfoRow icon={Calendar} text={`Gửi lúc: ${formatDateTime(invitation.createdAt)}`} />
                      <JockeyInfoRow
                        icon={DollarSign}
                        text={`Thù lao: ${invitation.remunerationText}`}
                        highlight
                      />

                      {invitation.message && (
                        <div className="mt-2 rounded-lg border border-white/5 bg-white/5 p-2 text-white/60 italic text-[11px] leading-relaxed">
                          "{invitation.message}"
                        </div>
                      )}

                      {hasAcceptedConflicts && (
                        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Trùng lịch đã nhận</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="flex gap-2 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => onReject(invitation.id)}
                      disabled={savingId === invitation.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={savingId === invitation.id || hasAcceptedConflicts}
                      onClick={() => onAccept(invitation)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#D4A017] hover:bg-[#B8941F] py-2 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Chấp nhận
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function JockeyInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null);

  const pendingCount = invitations.filter((invitation) => invitation.statusCode === "PENDING").length;
  const conflictMap = useMemo(() => buildConflictMap(invitations), [invitations]);

  // Group pending invitations by schedule/race conflicts
  const pendingGroups = useMemo(() => groupPendingInvitations(invitations), [invitations]);

  // Non-pending invitations
  const otherInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.statusCode !== "PENDING"),
    [invitations]
  );

  const loadInvitations = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await jockeyService.getJockeyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error("Không thể tải lời mời jockey", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể tải lời mời thi đấu");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const reject = async (id) => {
    try {
      setSavingId(id);
      const invitation = await jockeyService.rejectJockeyInvitation(id);
      setInvitations((prev) =>
        prev.map((item) => (item.id === invitation.id ? invitation : item))
      );
      toast.success("Đã từ chối lời mời thi đấu");
    } catch (error) {
      console.error("Không thể từ chối lời mời", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể từ chối lời mời");
    } finally {
      setSavingId(null);
    }
  };

  const confirmAccept = async () => {
    if (!acceptTarget) return;

    const conflicts = conflictMap[acceptTarget.id]?.pending ?? [];

    try {
      setSavingId(acceptTarget.id);
      await jockeyService.acceptJockeyInvitation(acceptTarget.id);
      setAcceptTarget(null);
      await loadInvitations({ silent: true });
      toast.success(
        conflicts.length > 0
          ? `Đã chấp nhận lời mời. ${conflicts.length} lời mời liên quan đã được cập nhật.`
          : "Đã chấp nhận lời mời thi đấu"
      );
    } catch (error) {
      console.error("Không thể chấp nhận lời mời", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể chấp nhận lời mời");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <JockeyLayout
      title="Jockey · Lời mời thi đấu"
      subtitle={`${pendingCount} lời mời đang chờ phản hồi`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${filter === item.key
              ? "bg-[#D4A017] text-white shadow-lg shadow-[#D4A017]/30"
              : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard className="p-10 text-center text-sm text-white/60">
          Đang tải lời mời thi đấu...
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Render pending groups if filter is PENDING or ALL */}
          {(filter === "PENDING" || filter === "ALL") &&
            pendingGroups.map((group, idx) => {
              if (group.length > 1) {
                return (
                  <InvitationComparisonGroup
                    key={`group-${idx}`}
                    group={group}
                    conflictMap={conflictMap}
                    onAccept={setAcceptTarget}
                    onReject={reject}
                    savingId={savingId}
                  />
                );
              } else {
                return (
                  <InvitationCard
                    key={group[0].id}
                    invitation={group[0]}
                    conflictMap={conflictMap}
                    onAccept={setAcceptTarget}
                    onReject={reject}
                    savingId={savingId}
                  />
                );
              }
            })}

          {/* Render non-pending (resolved) invitations if filter is ALL */}
          {filter === "ALL" &&
            otherInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                conflictMap={conflictMap}
                onAccept={setAcceptTarget}
                onReject={reject}
                savingId={savingId}
              />
            ))}

          {/* Render specific resolved filter tabs */}
          {filter !== "PENDING" &&
            filter !== "ALL" &&
            otherInvitations
              .filter((inv) => inv.statusCode === filter)
              .map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  conflictMap={conflictMap}
                  onAccept={setAcceptTarget}
                  onReject={reject}
                  savingId={savingId}
                />
              ))}

          {/* Empty states */}
          {filter === "PENDING" && pendingGroups.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/40">
              <Mail className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Không có lời mời chờ phản hồi</p>
            </div>
          )}

          {filter === "ALL" && invitations.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/40">
              <Mail className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Không có lời mời nào</p>
            </div>
          )}

          {filter !== "PENDING" &&
            filter !== "ALL" &&
            otherInvitations.filter((inv) => inv.statusCode === filter).length === 0 && (
              <div className="col-span-full py-16 text-center text-white/40">
                <Mail className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>Không có lời mời {statusMeta(filter).label.toLowerCase()}</p>
              </div>
            )}
        </div>
      )}

      {acceptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#101a2d] shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">
                    Xác nhận lịch thi đấu
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    Chấp nhận lời mời này?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAcceptTarget(null)}
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/[0.06] p-4">
                <p className="mb-2 text-xs font-bold text-emerald-100">Sẽ được chấp nhận</p>
                <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                  <span>Ngựa: {acceptTarget.horseName || "Chưa cập nhật"}</span>
                  <span>Race: {acceptTarget.raceName || "Chưa cập nhật"}</span>
                  <span>Lịch: {formatRaceWindow(acceptTarget)}</span>
                  <span>Thù lao: {acceptTarget.remunerationText}</span>
                </div>
              </div>

              {(conflictMap[acceptTarget.id]?.pending ?? []).length > 0 ? (
                <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    Những lời mời pending này sẽ bị backend tự hủy
                  </p>
                  <div className="space-y-2">
                    {conflictMap[acceptTarget.id].pending.map((item) => (
                      <MiniInvitationRow key={item.invitation.id} item={item} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
                  Không có lời mời pending nào bị hủy khi chấp nhận lời mời này.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAcceptTarget(null)}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10"
              >
                Xem lại
              </button>
              <PrimaryButton
                icon={Check}
                disabled={savingId === acceptTarget.id}
                onClick={confirmAccept}
              >
                Xác nhận chấp nhận
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </JockeyLayout>
  );
}
