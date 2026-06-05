import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  DollarSign,
  Mail,
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

const FILTERS = ["Tất cả", "Chờ phản hồi", "Đã nhận", "Từ chối", "Đã hủy"];

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function JockeyInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [filter, setFilter] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const pending = invitations.filter((invitation) => invitation.statusCode === "PENDING").length;
  const filtered = useMemo(
    () =>
      filter === "Tất cả"
        ? invitations
        : invitations.filter((invitation) => invitation.status === filter),
    [filter, invitations],
  );

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await jockeyService.getJockeyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error("Không thể tải lời mời jockey", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể tải lời mời thi đấu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const updateInvitation = (nextInvitation) => {
    setInvitations((prev) =>
      prev.map((invitation) => (invitation.id === nextInvitation.id ? nextInvitation : invitation)),
    );
  };

  const accept = async (id) => {
    try {
      setSavingId(id);
      const invitation = await jockeyService.acceptJockeyInvitation(id);
      updateInvitation(invitation);
      toast.success("Đã chấp nhận lời mời thi đấu");
    } catch (error) {
      console.error("Không thể chấp nhận lời mời", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể chấp nhận lời mời");
    } finally {
      setSavingId(null);
    }
  };

  const reject = async (id) => {
    try {
      setSavingId(id);
      const invitation = await jockeyService.rejectJockeyInvitation(id);
      updateInvitation(invitation);
      toast.success("Đã từ chối lời mời thi đấu");
    } catch (error) {
      console.error("Không thể từ chối lời mời", error?.response?.data || error);
      toast.error(getApiErrorMessage(error) || "Không thể từ chối lời mời");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <JockeyLayout
      title="Jockey · Lời mời thi đấu"
      subtitle={`${pending} lời mời đang chờ phản hồi`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${
              filter === item
                ? "bg-[#D4A017] text-white shadow-lg shadow-[#D4A017]/30"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard className="p-10 text-center text-sm text-white/60">
          Đang tải lời mời thi đấu...
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((invitation) => (
            <GlassCard
              key={invitation.id}
              className={invitation.statusCode === "PENDING" ? "border-[#D4A017]/20" : ""}
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
                  <Pill tone={invitation.statusTone}>{invitation.status}</Pill>
                </div>

                <div className="mb-4 space-y-2.5">
                  <JockeyInfoRow
                    icon={Calendar}
                    text={`Giải đấu: ${invitation.tournamentName || "Chưa cập nhật"}`}
                  />
                  <JockeyInfoRow
                    icon={PawPrint}
                    text={`Cuộc đua: ${invitation.raceName || "Chưa cập nhật"}`}
                  />
                  <JockeyInfoRow icon={User} text={`Mã owner: ${invitation.ownerId ?? "N/A"}`} />
                  <JockeyInfoRow icon={Calendar} text={`Gửi lúc: ${formatDate(invitation.createdAt)}`} />
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

                {invitation.statusCode === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reject(invitation.id)}
                      disabled={savingId === invitation.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                    <PrimaryButton
                      icon={Check}
                      className="flex-1"
                      disabled={savingId === invitation.id}
                      onClick={() => accept(invitation.id)}
                    >
                      Chấp nhận
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/40">
              <Mail className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Không có lời mời nào</p>
            </div>
          )}
        </div>
      )}
    </JockeyLayout>
  );
}
