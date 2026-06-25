import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Trophy,
  TrendingUp,
  ArrowRight,
  Medal,
  Mail,
} from "lucide-react";
import { JockeyLayout } from "./JockeyLayout";
import {
  GlassCard,
  StatCard,
  Pill,
  PrimaryButton,
  GhostButton,
} from "../admin/AdminLayout";
import { jockeyService } from "@/services/jockeyService";
import { rankingService } from "@/services/rankingService";
import { formatDisplayDate } from "@/utils/dateFormat";
import { fmtVND } from "@/utils/formatCurrency";
import {
  buildJockeyResults,
  buildJockeySchedules,
  mapRankingEntry,
} from "@/utils/jockeyViewUtils";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/utils/apiError";

export function JockeyDashboard() {
  const userId = useAuthStore((state) => state.user?.id ?? state.user?.userId);
  const [profile, setProfile] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [totalPrize, setTotalPrize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          profileData,
          invitationData,
          raceData,
          performanceData,
          rankingData,
        ] = await Promise.all([
          jockeyService.getMyProfile(),
          jockeyService.getJockeyInvitations(),
          jockeyService.getRaces(),
          jockeyService.getPerformance(),
          rankingService.getRankings(50),
        ]);

        if (!active) return;

        const scheduleItems = buildJockeySchedules(raceData, invitationData);
        const resultItems = buildJockeyResults(profileData?.raceHistory ?? []);
        const myRank = rankingData.jockeys
          .map((entry) => mapRankingEntry(entry, userId))
          .find((entry) => entry.isMe);

        setProfile({
          ...profileData,
          wins: Number(performanceData?.firstPlaces ?? profileData?.wins ?? 0),
          races: Number(performanceData?.raceCount ?? profileData?.races ?? 0),
          winRate:
            profileData?.winRate ??
            (Number(performanceData?.raceCount) > 0
              ? (
                  (Number(performanceData?.firstPlaces ?? 0) /
                    Number(performanceData?.raceCount)) *
                  100
                ).toFixed(1)
              : 0),
          ranking: myRank?.rank ?? profileData?.ranking ?? "—",
        });
        setInvitations(invitationData);
        setSchedules(scheduleItems);
        setResults(resultItems);
        setRanking(myRank ?? null);
        setTotalPrize(
          Number(performanceData?.totalJockeyPayout ?? 0) +
            Number(performanceData?.totalPrizePayout ?? 0),
        );
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err) || "Không thể tải dashboard jockey");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const pendingInvitations = useMemo(
    () => invitations.filter((item) => item.statusCode === "PENDING"),
    [invitations],
  );
  const displayName = profile?.name || "Jockey";

  return (
    <JockeyLayout
      title="Jockey · Dashboard"
      subtitle={
        loading
          ? "Đang tải dữ liệu..."
          : `Chào ${displayName} · Rank #${profile?.ranking ?? "—"} · ${pendingInvitations.length} lời mời đang chờ`
      }
      actions={
        <>
          <Link to="/jockey/invitations">
            <GhostButton icon={Mail}>
              Lời mời ({pendingInvitations.length})
            </GhostButton>
          </Link>
          <Link to="/jockey/schedules">
            <PrimaryButton icon={Calendar}>Lịch race</PrimaryButton>
          </Link>
        </>
      }
    >
      {error && (
        <GlassCard className="mb-6 border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </GlassCard>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Xếp hạng"
          value={`#${profile?.ranking ?? "—"}`}
          icon={Trophy}
          tone="gold"
          delta={ranking ? `${ranking.wins} thắng` : undefined}
        />
        <StatCard
          label="Tổng chiến thắng"
          value={String(profile?.wins ?? 0)}
          icon={Medal}
          tone="green"
        />
        <StatCard
          label="Tỷ lệ thắng"
          value={`${profile?.winRate ?? 0}%`}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          label="Tổng thưởng"
          value={fmtVND(totalPrize).replace("₫", "").trim()}
          icon={Trophy}
          tone="purple"
        />
      </div>

      <div className="space-y-6">
        <GlassCard>
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4A017]/15 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#D4A017]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Lịch race sắp tới</h2>
                <p className="text-xs text-white/50">Race đã đăng ký</p>
              </div>
            </div>
            <Link
              to="/jockey/schedules"
              className="text-xs text-[#D4A017] hover:underline font-semibold flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-white/50">Đang tải lịch...</p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-white/50">Chưa có lịch race nào.</p>
            ) : (
              schedules.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:border-[#D4A017]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0 w-16">
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Giờ</div>
                      <div className="text-xl font-bold text-[#D4A017]">{s.time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Pill tone={s.statusTone}>{s.status}</Pill>
                        <h3 className="font-bold text-white text-sm truncate">{s.tournament}</h3>
                      </div>
                      <div className="text-[11px] text-white/50">
                        {s.race} · Ngựa: {s.horse}
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        {formatDisplayDate(s.date)} · {s.location}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {pendingInvitations.length > 0 && (
          <GlassCard className="border-[#D4A017]/20">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Lời mời chờ xử lý</h2>
                  <p className="text-xs text-white/50">
                    {pendingInvitations.length} lời mời cần phản hồi
                  </p>
                </div>
              </div>
              <Link
                to="/jockey/invitations"
                className="text-xs text-[#D4A017] hover:underline font-semibold flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {pendingInvitations.slice(0, 2).map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-[#D4A017]/5 border border-[#D4A017]/20 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {inv.horseName || "Ngựa chưa cập nhật"}
                      </div>
                      <div className="text-xs text-white/50">
                        Từ chủ ngựa: {inv.ownerUsername || `Owner #${inv.ownerId}`}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {inv.message || "Không có lời nhắn"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#D4A017]">
                        {inv.remunerationText}
                      </div>
                      <div className="text-[10px] text-white/40">Thù lao</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard>
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                <Medal className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Kết quả gần đây</h2>
                <p className="text-xs text-white/50">Lịch sử thi đấu</p>
              </div>
            </div>
            <Link
              to="/jockey/results"
              className="text-xs text-[#D4A017] hover:underline font-semibold flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-white/50">Chưa có kết quả thi đấu.</p>
            ) : (
              results.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                      r.position === 1
                        ? "bg-[#D4A017]/20 text-[#D4A017] border-[#D4A017]/40"
                        : r.position === 2
                          ? "bg-slate-400/20 text-slate-300 border-slate-400/40"
                          : "bg-amber-700/20 text-amber-600 border-amber-700/40"
                    }`}
                  >
                    #{r.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{r.horse}</div>
                    <div className="text-[11px] text-white/50">
                      {r.race} · {r.tournament}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-white/40">{formatDisplayDate(r.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </JockeyLayout>
  );
}
