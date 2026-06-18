import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, CheckCircle, Eye, FileText, Send, Search, Trophy, Users, X } from "lucide-react";
import { toast } from "sonner";
import { horseService } from "@/services/horseService";
import { jockeyService } from "@/services/jockeyService";
import { tournamentService } from "@/services/tournamentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDate, formatDisplayDateTime } from "@/utils/dateFormat";
import {
  GlassCard,
  GhostButton,
  Pill,
  PrimaryButton,
  TextInput,
} from "../admin/AdminLayout";
import { HorseOwnerLayout } from "./HorseOwnerLayout";
import { HorseOwnerFormField } from "./components/HorseOwnerFormField";

function findInvitationsForJockey(invitations, jockey) {
  return invitations.filter((invitation) => String(invitation.jockeyId) === String(jockey.userId));
}

function mergeJockeyAccountsWithProfiles(accounts, approvedProfiles) {
  if (!accounts.length) {
    return approvedProfiles;
  }

  const profileByUserId = new Map(
    approvedProfiles.map((profile) => [String(profile.userId), profile]),
  );

  return accounts.map((account) => {
    const profile = profileByUserId.get(String(account.userId));
    if (!profile) return account;

    return {
      ...account,
      ...profile,
      id: account.id,
      userId: account.userId,
      profileId: profile.profileId,
      name: profile.name || account.name,
      username: profile.username || account.username,
      avatarUrl: profile.avatarUrl || account.avatarUrl,
      active: account.active,
      hasApprovedProfile: account.active,
      statusCode: account.active ? profile.statusCode : "INACTIVE",
      status: account.active ? profile.status : "Tài khoản bị khóa",
      statusTone: account.active ? profile.statusTone : "red",
      raw: { account: account.raw, profile: profile.raw },
    };
  });
}

function formatRaceDate(value) {
  return formatDisplayDateTime(value, "Chưa cập nhật");
}

const INVITABLE_STATUSES = ["PUBLISHED", "OPEN_REGISTRATION"];

function buildRaceOptions(tournaments) {
  return tournaments.flatMap((tournament) =>
    (tournament.races ?? [])
      .filter(
        (race) =>
          race.id &&
          INVITABLE_STATUSES.includes(tournament.statusCode) &&
          INVITABLE_STATUSES.includes(race.statusCode ?? race.raw?.status),
      )
      .map((race) => ({
        id: String(race.id),
        tournamentId: String(tournament.id),
        label: `${tournament.name} · ${race.name}`,
        meta: `${formatDisplayDate(race.date, "Chưa cập nhật")} ${race.time || ""}`.trim(),
        scheduledStartAt: race.scheduledStartAt,
        scheduledEndAt: race.scheduledEndAt,
        venueName: race.venueName,
        venueAddress: race.venueAddress,
      })),
  );
}

function isActiveInvitation(invitation) {
  return ["PENDING", "ACCEPTED"].includes(invitation?.statusCode);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function schedulesOverlap(firstStartAt, firstEndAt, secondStartAt, secondEndAt) {
  const firstStart = parseDate(firstStartAt);
  const firstEnd = parseDate(firstEndAt);
  const secondStart = parseDate(secondStartAt);
  const secondEnd = parseDate(secondEndAt);

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;
  return firstStart < secondEnd && firstEnd > secondStart;
}

function summarizeJockeyInvitations(invitations) {
  const pending = invitations.filter((invitation) => invitation.statusCode === "PENDING");
  const accepted = invitations.filter((invitation) => invitation.statusCode === "ACCEPTED");

  return {
    latest: invitations[0] ?? null,
    pending,
    accepted,
    pendingCount: pending.length,
    acceptedCount: accepted.length,
    totalCount: invitations.length,
    assigned: accepted.map((invitation) => invitation.horseName).filter(Boolean).join(", "),
  };
}

async function loadInvitableTournaments() {
  const listResponse = await tournamentService.getPublicTournaments();
  const invitableSummaries = (listResponse.data ?? []).filter((tournament) =>
    INVITABLE_STATUSES.includes(tournament.statusCode),
  );

  const detailResponses = await Promise.all(
    invitableSummaries.map((tournament) =>
      tournamentService.getPublicTournament(tournament.id).catch((error) => {
        console.warn("Không thể tải chi tiết giải đấu", tournament.id, error?.response?.data || error);
        return { data: tournament };
      }),
    ),
  );

  return detailResponses
    .map((response) => response.data)
    .filter((tournament) => INVITABLE_STATUSES.includes(tournament?.statusCode));
}

export function HorseOwnerJockeys() {
  const [searchParams] = useSearchParams();
  const selectedTournamentId = searchParams.get("tournamentId") || "";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [jockeys, setJockeys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [horses, setHorses] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [invitationDetailTarget, setInvitationDetailTarget] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [inviteForm, setInviteForm] = useState({ horseId: "", raceId: "", remunerationAmount: "", message: "" });

  const approvedHorses = useMemo(
    () => horses.filter((horse) => horse.statusCode === "APPROVED"),
    [horses],
  );

  const raceOptions = useMemo(() => buildRaceOptions(tournaments), [tournaments]);
  const scopedRaceOptions = useMemo(
    () =>
      selectedTournamentId
        ? raceOptions.filter((race) => String(race.tournamentId) === String(selectedTournamentId))
        : raceOptions,
    [raceOptions, selectedTournamentId],
  );
  const raceOptionById = useMemo(
    () => new Map(raceOptions.map((race) => [String(race.id), race])),
    [raceOptions],
  );
  const selectedTournament = useMemo(
    () =>
      selectedTournamentId
        ? tournaments.find((tournament) => String(tournament.id) === String(selectedTournamentId))
        : null,
    [selectedTournamentId, tournaments],
  );

  const activeInvitations = useMemo(
    () => invitations.filter(isActiveInvitation),
    [invitations],
  );

  const getHorseRaceBlockReason = (horseId, raceId) => {
    if (!horseId || !raceId) return null;

    const selectedRace = raceOptionById.get(String(raceId));
    const blockedInvitation = activeInvitations.find((invitation) => {
      if (String(invitation.horseId) !== String(horseId)) return false;
      if (String(invitation.raceId) === String(raceId)) return true;

      return schedulesOverlap(
        invitation.raceScheduledStartAt,
        invitation.raceScheduledEndAt,
        selectedRace?.scheduledStartAt,
        selectedRace?.scheduledEndAt,
      );
    });

    if (!blockedInvitation) return null;
    return String(blockedInvitation.raceId) === String(raceId)
      ? "Ngựa đã có lời mời trong race này"
      : "Ngựa đã có lời mời ở race trùng giờ";
  };

  const pendingJockeyRaceConflicts = useMemo(() => {
    if (!inviteTarget || !inviteForm.raceId) return [];

    const selectedRace = raceOptionById.get(String(inviteForm.raceId));
    return invitations
      .filter(
        (invitation) =>
          invitation.statusCode === "PENDING" &&
          String(invitation.jockeyId) === String(inviteTarget.userId) &&
          String(invitation.raceId) !== String(inviteForm.raceId) &&
          schedulesOverlap(
            invitation.raceScheduledStartAt,
            invitation.raceScheduledEndAt,
            selectedRace?.scheduledStartAt,
            selectedRace?.scheduledEndAt,
          ),
      );
  }, [invitations, inviteForm.raceId, inviteTarget, raceOptionById]);

  const isHorseRaceBlocked = (horseId, raceId) =>
    Boolean(getHorseRaceBlockReason(horseId, raceId));

  const isHorseDisabledForSelectedRace = (horseId) => isHorseRaceBlocked(horseId, inviteForm.raceId);

  const isRaceDisabledForSelectedHorse = (raceId) => isHorseRaceBlocked(inviteForm.horseId, raceId);

  const findFirstAvailableInvitePair = () => {
    for (const horse of approvedHorses) {
      for (const race of scopedRaceOptions) {
        if (!isHorseRaceBlocked(horse.id, race.id)) {
          return { horseId: String(horse.id), raceId: String(race.id) };
        }
      }
    }
    return null;
  };

  useEffect(() => {
    let ignore = false;

    Promise.all([
      jockeyService.getJockeyAccounts().catch((error) => {
        console.warn("Không thể tải tài khoản jockey", error?.response?.data || error);
        return [];
      }),
      jockeyService.getAvailableJockeys(),
      jockeyService.getOwnerInvitations(),
      horseService.getOwnerHorses(),
      loadInvitableTournaments().catch((error) => {
        console.warn("Không thể tải danh sách cuộc đua", error?.response?.data || error);
        return [];
      }),
    ])
      .then(([jockeyAccounts, availableJockeys, ownerInvitations, ownerHorses, publicTournaments]) => {
        if (ignore) return;
        setJockeys(mergeJockeyAccountsWithProfiles(jockeyAccounts, availableJockeys));
        setInvitations(ownerInvitations);
        setHorses(ownerHorses);
        setTournaments(publicTournaments);
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Không thể tải dữ liệu jockey", error?.response?.data || error);
        toast.error(getApiErrorMessage(error) || "Không thể tải dữ liệu jockey");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const enrichedJockeys = useMemo(
    () =>
      jockeys.map((jockey) => {
        const jockeyInvitations = findInvitationsForJockey(invitations, jockey);
        const invitationSummary = summarizeJockeyInvitations(jockeyInvitations);
        const status =
          invitationSummary.pendingCount > 0
            ? "Chá» pháº£n há»“i"
            : invitationSummary.acceptedCount > 0
              ? "ÄÃ£ nháº­n"
              : jockey.status;
        const statusTone =
          invitationSummary.pendingCount > 0
            ? "gold"
            : invitationSummary.acceptedCount > 0
              ? "green"
              : jockey.statusTone;

        return {
          ...jockey,
          invitations: jockeyInvitations,
          invitationSummary,
          latestInvitation: invitationSummary.latest,
          status,
          statusTone,
          assigned: invitationSummary.assigned || null,
        };
      }),
    [invitations, jockeys],
  );

  const filtered = enrichedJockeys.filter((jockey) => {
    const normalized = search.trim().toLowerCase();
    const matchSearch =
      !normalized ||
      `${jockey.name} ${jockey.username} ${jockey.email ?? ""} ${jockey.license}`
        .toLowerCase()
        .includes(normalized);
    const matchStatus = filterStatus === "Tất cả" || jockey.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleInviteHorseChange = (horseId) => {
    const currentRaceStillAvailable = inviteForm.raceId && !isHorseRaceBlocked(horseId, inviteForm.raceId);
    const nextRaceId = currentRaceStillAvailable
      ? inviteForm.raceId
      : scopedRaceOptions.find((race) => !isHorseRaceBlocked(horseId, race.id))?.id ?? "";

    setInviteForm((prev) => ({ ...prev, horseId, raceId: nextRaceId }));
  };

  const handleInviteRaceChange = (raceId) => {
    const currentHorseStillAvailable = inviteForm.horseId && !isHorseRaceBlocked(inviteForm.horseId, raceId);
    const nextHorseId = currentHorseStillAvailable
      ? inviteForm.horseId
      : approvedHorses.find((horse) => !isHorseRaceBlocked(horse.id, raceId))?.id ?? "";

    setInviteForm((prev) => ({ ...prev, horseId: String(nextHorseId), raceId }));
  };

  const openInvite = (jockey) => {
    if (!jockey.active) {
      toast.error("Tài khoản jockey này đang bị khóa");
      return;
    }
    if (!jockey.hasApprovedProfile) {
      toast.error("Jockey này chưa có hồ sơ đã duyệt nên chưa thể mời");
      return;
    }
    if (approvedHorses.length === 0) {
      toast.error("Bạn cần có ít nhất một ngựa đã duyệt để mời jockey");
      return;
    }
    if (scopedRaceOptions.length === 0) {
      toast.error("Chưa có cuộc đua nào đang mở để gửi lời mời");
      return;
    }
    const firstAvailablePair = findFirstAvailableInvitePair();
    if (!firstAvailablePair) {
      toast.error("Tất cả ngựa đã có lời mời hoặc đã nhận chạy trong các cuộc đua hiện có");
      return;
    }
    setInviteTarget(jockey);
    setInviteForm({
      horseId: firstAvailablePair.horseId,
      raceId: firstAvailablePair.raceId,
      remunerationAmount: "",
      message: "",
    });
  };

  const openDetail = async (jockey) => {
    if (!jockey.hasApprovedProfile) {
      toast.error("Jockey này chưa có hồ sơ đã duyệt");
      return;
    }

    try {
      setLoadingDetail(true);
      setDetailTarget(jockey);
      const detail = await jockeyService.getJockeyDetail(jockey.userId);
      setDetailTarget({
        ...jockey,
        ...detail,
        invitations: jockey.invitations,
        invitationSummary: jockey.invitationSummary,
        latestInvitation: jockey.latestInvitation,
        assigned: jockey.assigned,
      });
    } catch (error) {
      console.error("Không thể tải chi tiết jockey", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể tải chi tiết jockey");
      setDetailTarget(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setLoadingDetail(false);
  };

  const openInvitationDetail = (jockey) => {
    if (!jockey.invitations?.length) return;
    setInvitationDetailTarget({
      jockeyName: jockey.name,
      jockeyLicense: jockey.license,
      ...jockey.invitationSummary.latest,
      invitations: jockey.invitations,
      invitationSummary: jockey.invitationSummary,
    });
  };

  const closeInvitationDetail = () => {
    setInvitationDetailTarget(null);
  };

  const closeInvite = () => {
    setInviteTarget(null);
    setInviteForm({ horseId: "", raceId: "", remunerationAmount: "", message: "" });
  };

  const submitInvite = async () => {
    if (!inviteTarget || !inviteForm.horseId) {
      toast.error("Vui lòng chọn ngựa để gửi lời mời");
      return;
    }
    if (!inviteForm.raceId) {
      toast.error("Vui lòng chọn cuộc đua để gửi lời mời");
      return;
    }
    if (isHorseRaceBlocked(inviteForm.horseId, inviteForm.raceId)) {
      toast.error("Ngựa này đã có lời mời hoặc đã nhận chạy trong cuộc đua đã chọn");
      return;
    }
    const remunerationAmount = Number(inviteForm.remunerationAmount);
    if (!Number.isFinite(remunerationAmount) || remunerationAmount < 0) {
      toast.error("Vui lòng nhập thù lao hợp lệ");
      return;
    }

    try {
      setSaving(true);
      const invitation = await jockeyService.createInvitation({
        horseId: Number(inviteForm.horseId),
        raceId: Number(inviteForm.raceId),
        jockeyId: Number(inviteTarget.userId),
        remunerationAmount,
        message: inviteForm.message,
      });
      setInvitations((prev) => [invitation, ...prev]);
      toast.success(
        selectedTournamentId
          ? `Đã gửi lời mời đến jockey ${inviteTarget.name}. Chờ jockey chấp nhận rồi quay lại Đăng ký thi đấu.`
          : `Đã gửi lời mời đến jockey ${inviteTarget.name}`,
      );
      closeInvite();
    } catch (error) {
      console.error("Không thể gửi lời mời jockey", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể gửi lời mời jockey");
    } finally {
      setSaving(false);
    }
  };

  const cancelInvite = async (invitation) => {
    try {
      setSaving(true);
      const nextInvitation = await jockeyService.cancelInvitation(invitation.id);
      setInvitations((prev) =>
        prev.map((item) => (item.id === invitation.id ? nextInvitation : item)),
      );
      setInvitationDetailTarget((current) =>
        current
          ? {
              ...current,
              ...nextInvitation,
              invitations: (current.invitations ?? []).map((item) =>
                item.id === nextInvitation.id ? nextInvitation : item,
              ),
            }
          : current,
      );
      toast.success("Đã hủy lời mời jockey");
    } catch (error) {
      console.error("Không thể hủy lời mời jockey", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể hủy lời mời jockey");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HorseOwnerLayout
      title="Horse Owner · Jockey"
      subtitle="Tìm kiếm tất cả account jockey, gửi lời mời theo ngựa và theo dõi trạng thái phản hồi"
    >
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, username, mã giấy phép..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#D4A017]/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Tất cả",
            "Sẵn sàng",
            "Chưa có hồ sơ duyệt",
            "Tài khoản bị khóa",
            "Chờ phản hồi",
            "Đã nhận",
            "Từ chối",
            "Đã hủy",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filterStatus === status
                  ? "bg-[#D4A017] text-white shadow-lg shadow-[#D4A017]/30"
                  : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {selectedTournamentId && (
        <GlassCard className="mb-6 border-[#D4A017]/25 bg-[#D4A017]/10 p-4">
          <div className="text-sm font-semibold text-white">
            Đang mời jockey cho {selectedTournament?.name || "giải đấu đã chọn"}
          </div>
          <p className="mt-1 text-xs text-white/55">
            Danh sách cuộc đua trong form mời sẽ chỉ hiển thị các race thuộc giải này.
          </p>
        </GlassCard>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A017]/15">
            <Users className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{jockeys.length}</div>
            <div className="text-xs text-white/50">Tổng jockey</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <CheckCircle className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {invitations.filter((invitation) => invitation.statusCode === "ACCEPTED").length}
            </div>
            <div className="text-xs text-white/50">Đã nhận lời</div>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
            <Trophy className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {invitations.filter((invitation) => invitation.statusCode === "PENDING").length}
            </div>
            <div className="text-xs text-white/50">Đang chờ phản hồi</div>
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <GlassCard className="p-10 text-center text-sm text-white/60">
          Đang tải danh sách jockey...
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((jockey) => (
            <GlassCard key={jockey.id} className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#D4A017]/20 bg-gradient-to-br from-[#D4A017]/20 to-[#0F1E3A] text-2xl font-bold text-[#D4A017]">
                  {jockey.avatarUrl ? (
                    <img src={jockey.avatarUrl} alt={jockey.name} className="h-full w-full object-cover" />
                  ) : (
                    jockey.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-white">{jockey.name}</h3>
                  <p className="text-xs text-white/50">{jockey.license}</p>
                  <div className="mt-1">
                    <Pill tone={jockey.statusTone}>{jockey.status}</Pill>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.04] p-3">
                <div className="text-center">
                  <div className="text-base font-bold text-[#D4A017]">{jockey.wins}</div>
                  <div className="text-[10px] text-white/40">Thắng</div>
                </div>
                <div className="border-x border-white/10 text-center">
                  <div className="text-base font-bold text-white">{jockey.races}</div>
                  <div className="text-[10px] text-white/40">Race</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-emerald-300">{jockey.winRate}%</div>
                  <div className="text-[10px] text-white/40">Tỷ lệ</div>
                </div>
              </div>

              <div className="mb-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Kinh nghiệm</span>
                  <span className="font-semibold text-white">{jockey.experience} năm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Chiều cao / cân nặng</span>
                  <span className="font-semibold text-white">
                    {jockey.height || 0} cm · {jockey.weight || 0} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Ngựa đã nhận</span>
                  <span className="font-semibold text-white">{jockey.assigned ?? "Chưa có"}</span>
                </div>
              </div>

              {jockey.invitationSummary?.totalCount > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[#D4A017]/20 bg-[#D4A017]/10 p-3">
                    <div className="text-lg font-bold text-[#D4A017]">
                      {jockey.invitationSummary.pendingCount}
                    </div>
                    <div className="text-white/50">Lời mời đang chờ</div>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                    <div className="text-lg font-bold text-emerald-300">
                      {jockey.invitationSummary.acceptedCount}
                    </div>
                    <div className="text-white/50">Lời mời đã nhận</div>
                  </div>
                </div>
              )}

              {jockey.specialties && (
                <p className="mb-4 line-clamp-2 text-xs text-white/45">{jockey.specialties}</p>
              )}

              <div className="flex gap-2">
                <GhostButton className="flex-1" icon={Eye} onClick={() => openDetail(jockey)}>
                  Xem chi tiết
                </GhostButton>
                {jockey.invitations?.length < 0 ? (
                  <GhostButton
                    className="flex-1"
                    icon={X}
                    disabled={saving}
                    onClick={() => cancelInvite(jockey.invitation)}
                  >
                    Hủy lời mời
                  </GhostButton>
                ) : (
                  <GhostButton
                    className="flex-1"
                    icon={Send}
                    disabled={!jockey.active || !jockey.hasApprovedProfile}
                    onClick={() => openInvite(jockey)}
                  >
                    Mời
                  </GhostButton>
                )}
                {jockey.invitations?.length > 0 && (
                  <PrimaryButton className="flex-1" icon={Eye} onClick={() => openInvitationDetail(jockey)}>
                    Chi tiết lời mời
                  </PrimaryButton>
                )}
              </div>
            </GlassCard>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/40">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Không tìm thấy jockey nào</p>
            </div>
          )}
        </div>
      )}

      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <GlassCard className="max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#D4A017]/20 bg-gradient-to-br from-[#D4A017]/20 to-[#0F1E3A] text-2xl font-bold text-[#D4A017]">
                  {detailTarget.avatarUrl ? (
                    <img
                      src={detailTarget.avatarUrl}
                      alt={detailTarget.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    detailTarget.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-white">{detailTarget.name}</h2>
                  <p className="mt-1 text-sm text-white/45">{detailTarget.license}</p>
                  <div className="mt-2">
                    <Pill tone={detailTarget.statusTone}>{detailTarget.status}</Pill>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-1.5 transition-all hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-112px)] overflow-y-auto p-5">
              {loadingDetail ? (
                <div className="py-14 text-center text-sm text-white/55">Đang tải chi tiết jockey...</div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.04] p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#D4A017]">{detailTarget.wins}</div>
                      <div className="text-xs text-white/45">Thắng</div>
                    </div>
                    <div className="border-x border-white/10 text-center">
                      <div className="text-xl font-bold text-white">{detailTarget.races}</div>
                      <div className="text-xs text-white/45">Race</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-300">{detailTarget.winRate}%</div>
                      <div className="text-xs text-white/45">Tỷ lệ thắng</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Kinh nghiệm", `${detailTarget.experience || 0} năm`],
                      ["Chiều cao", `${detailTarget.height || 0} cm`],
                      ["Cân nặng", `${detailTarget.weight || 0} kg`],
                      ["Ngựa đã nhận", detailTarget.assigned ?? "Chưa có"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</div>
                        <div className="mt-1 font-semibold text-white">{value}</div>
                      </div>
                    ))}
                  </div>

                  {(detailTarget.bio || detailTarget.specialties || detailTarget.awards) && (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      {detailTarget.bio && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                            Giới thiệu
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/70">{detailTarget.bio}</p>
                        </div>
                      )}
                      {detailTarget.specialties && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                            Chuyên môn
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/70">{detailTarget.specialties}</p>
                        </div>
                      )}
                      {detailTarget.awards && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-white/40">
                            Thành tích
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/70">{detailTarget.awards}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailTarget.licenseDocumentUrl && (
                      <a
                        href={detailTarget.licenseDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#D4A017]/50"
                      >
                        <FileText className="h-4 w-4 text-[#D4A017]" />
                        Xem giấy phép
                      </a>
                    )}
                    {detailTarget.achievements && (
                      <a
                        href={detailTarget.achievements}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#D4A017]/50"
                      >
                        <Award className="h-4 w-4 text-[#D4A017]" />
                        Xem ảnh thành tích
                      </a>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="mb-3 font-bold text-white">Lịch sử thi đấu</h3>
                    {detailTarget.raceHistory?.length ? (
                      <div className="space-y-2">
                        {detailTarget.raceHistory.map((race, index) => (
                          <div
                            key={`${race.raceId ?? index}-${race.scheduledStartAt ?? index}`}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-semibold text-white">{race.raceName ?? "Cuộc đua"}</div>
                                <div className="mt-1 text-xs text-white/45">
                                  {race.tournamentName ?? "Giải đấu"} · {formatRaceDate(race.scheduledStartAt)}
                                </div>
                              </div>
                              <Pill tone={Number(race.rank) === 1 ? "gold" : "gray"}>
                                {race.rank ? `Hạng ${race.rank}` : race.status ?? "Chưa có kết quả"}
                              </Pill>
                            </div>
                            {race.horseName && (
                              <div className="mt-2 text-xs text-white/50">Ngựa: {race.horseName}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-white/45">
                        Chưa có lịch sử thi đấu
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {invitationDetailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="font-bold text-white">Chi tiết lời mời</h2>
                <p className="mt-1 text-sm text-white/45">
                  {invitationDetailTarget.jockeyName} · {invitationDetailTarget.jockeyLicense}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInvitationDetail}
                className="rounded-lg p-1.5 transition-all hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Trạng thái</div>
                  <div className="mt-2">
                    <Pill tone={invitationDetailTarget.statusTone}>
                      {invitationDetailTarget.status}
                    </Pill>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Thù lao</div>
                  <div className="mt-1 text-lg font-bold text-[#D4A017]">
                    {invitationDetailTarget.remunerationText}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Ngựa", invitationDetailTarget.horseName || "Chưa cập nhật"],
                  ["Jockey", invitationDetailTarget.jockeyName || invitationDetailTarget.jockeyUsername],
                  ["Giải đấu", invitationDetailTarget.tournamentName || "Chưa cập nhật"],
                  ["Cuộc đua", invitationDetailTarget.raceName || "Chưa cập nhật"],
                  ["Mã lời mời", `#${invitationDetailTarget.rawId ?? invitationDetailTarget.id}`],
                  ["Gửi lúc", formatRaceDate(invitationDetailTarget.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</div>
                    <div className="mt-1 font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>

              {invitationDetailTarget.message && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Lời nhắn</div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{invitationDetailTarget.message}</p>
                </div>
              )}

              {invitationDetailTarget.responseNote && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Phản hồi của jockey</div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{invitationDetailTarget.responseNote}</p>
                </div>
              )}

              {invitationDetailTarget.invitations?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                    Tất cả lời mời của jockey này
                  </div>
                  <div className="space-y-2">
                    {invitationDetailTarget.invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-white">
                              {invitation.raceName || "Race chưa cập nhật"}
                            </div>
                            <div className="mt-1 text-xs text-white/45">
                              {invitation.horseName || "Ngựa chưa cập nhật"} · {formatRaceDate(invitation.raceScheduledStartAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill tone={invitation.statusTone}>{invitation.status}</Pill>
                            {invitation.statusCode === "PENDING" && (
                              <GhostButton
                                icon={X}
                                disabled={saving}
                                onClick={() => cancelInvite(invitation)}
                              >
                                Hủy
                              </GhostButton>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-white/10 pt-4">
                <GhostButton onClick={closeInvitationDetail}>Đóng</GhostButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {inviteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="font-bold text-white">Mời jockey</h2>
                <p className="mt-1 text-sm text-white/45">{inviteTarget.name}</p>
              </div>
              <button
                type="button"
                onClick={closeInvite}
                className="rounded-lg p-1.5 transition-all hover:bg-white/10"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <HorseOwnerFormField label="Chọn ngựa đã duyệt">
                <select
                  value={inviteForm.horseId}
                  onChange={(event) => handleInviteHorseChange(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#17191d] px-4 py-2.5 text-sm text-white focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/20"
                >
                  {approvedHorses.map((horse) => (
                    <option
                      key={horse.id}
                      value={horse.id}
                      disabled={isHorseDisabledForSelectedRace(horse.id)}
                      className="bg-[#17191d] text-white"
                    >
                      {horse.name}{isHorseDisabledForSelectedRace(horse.id) ? " · đã có lời mời" : ""}
                    </option>
                  ))}
                </select>
              </HorseOwnerFormField>

              <HorseOwnerFormField label="Cuộc đua">
                <select
                  value={inviteForm.raceId}
                  onChange={(event) => handleInviteRaceChange(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#17191d] px-4 py-2.5 text-sm text-white focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/20"
                >
                  {scopedRaceOptions.map((race) => (
                    <option
                      key={race.id}
                      value={race.id}
                      disabled={isRaceDisabledForSelectedHorse(race.id)}
                      className="bg-[#17191d] text-white"
                    >
                      {race.label} · {race.meta}{isRaceDisabledForSelectedHorse(race.id) ? " · ngựa đã có lời mời" : ""}
                    </option>
                  ))}
                </select>
              </HorseOwnerFormField>

              <HorseOwnerFormField label="Thù lao lời mời (VNĐ)">
                {pendingJockeyRaceConflicts.length > 0 && (
                  <div className="mb-4 rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/10 p-3 text-xs text-white/70">
                    <div className="font-semibold text-[#D4A017]">Lưu ý lịch jockey</div>
                    <p className="mt-1">
                      Jockey này đang có {pendingJockeyRaceConflicts.length} lời mời pending trùng giờ.
                      Nếu jockey nhận một lời mời, backend sẽ tự hủy các lời mời còn lại bị trùng lịch.
                    </p>
                  </div>
                )}

                <TextInput
                  type="number"
                  min="0"
                  step="1000"
                  value={inviteForm.remunerationAmount}
                  onChange={(event) => setInviteForm({ ...inviteForm, remunerationAmount: event.target.value })}
                  placeholder="VD: 5000000"
                />
              </HorseOwnerFormField>

              <HorseOwnerFormField label="Lời nhắn">
                <TextInput
                  value={inviteForm.message}
                  onChange={(event) => setInviteForm({ ...inviteForm, message: event.target.value })}
                  placeholder="Gửi lời mời tham gia đội..."
                />
              </HorseOwnerFormField>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 p-5">
              <GhostButton onClick={closeInvite} disabled={saving}>
                Hủy
              </GhostButton>
              <PrimaryButton onClick={submitInvite} disabled={saving} icon={Send}>
                {saving ? "Đang gửi..." : "Gửi lời mời"}
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      )}
    </HorseOwnerLayout>
  );
}
