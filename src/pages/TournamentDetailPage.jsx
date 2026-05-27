import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Flag, MapPin, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { tournamentApi } from "@/api/tournamentApi";

export default function TournamentDetailPage() {
  const { id = "" } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournament() {
      try {
        setLoading(true);
        const data = await tournamentApi.getById(id);
        setTournament(data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin giải đấu");
        setTournament(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadTournament();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[#1E3A5F]/55">
        Đang tải giải đấu...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[#1E3A5F]/55">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-white to-[#FAFAFA] pt-24">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#1E3A5F]/10 bg-white shadow-2xl shadow-[#1E3A5F]/5">
          <div className="relative h-80">
            <img
              src={
                tournament.banner ||
                "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
              }
              alt={tournament.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white md:p-12">
              <div className="mb-4 inline-flex rounded-full bg-[#D4A017] px-4 py-1 text-sm font-semibold">
                {tournament.status}
              </div>
              <h1 className="text-4xl font-bold md:text-6xl">
                {tournament.name}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-white/80">
                {tournament.description}
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  icon={MapPin}
                  title="Địa điểm"
                  value={tournament.location}
                />
                <InfoCard
                  icon={CalendarDays}
                  title="Thời gian"
                  value={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
                />
                <InfoCard
                  icon={Users}
                  title="Đăng ký"
                  value={`${tournament.registrationCount || 0} người tham gia`}
                />
              </div>

              <section className="rounded-3xl border border-[#1E3A5F]/10 bg-[#FAFAFA] p-6">
                <h2 className="mb-4 text-2xl font-bold text-[#1E3A5F]">
                  Cấu hình giải đấu
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Meta
                    label="Loại"
                    value={
                      tournament.type === "championship"
                        ? "Giải đấu chính"
                        : "Giải thường"
                    }
                  />
                  <Meta
                    label="Phí vào cửa"
                    value={formatMoney(tournament.config?.entryFee)}
                  />
                  <Meta
                    label="Tiền cọc"
                    value={formatMoney(tournament.config?.depositFee)}
                  />
                  <Meta
                    label="Hoàn cọc sau"
                    value={`${tournament.config?.refundDays ?? 0} ngày`}
                  />
                  <Meta
                    label="Tối đa cuộc đua"
                    value={String(tournament.config?.maxRaces ?? 0)}
                  />
                  <Meta
                    label="Yêu cầu jockey"
                    value={booleanText(tournament.config?.requireJockey)}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-[#1E3A5F]/10 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#1E3A5F]">
                    Các cuộc đua
                  </h2>
                  <Link
                    to={`/tournaments/${tournament.id}/results`}
                    className="text-sm font-semibold text-[#D4A017] hover:underline"
                  >
                    Xem kết quả
                  </Link>
                </div>
                <div className="space-y-4">
                  {(tournament.races || []).length === 0 ? (
                    <p className="text-[#1E3A5F]/55">Chưa có cuộc đua nào.</p>
                  ) : (
                    tournament.races.map((race) => (
                      <div
                        key={race.id}
                        className="rounded-2xl border border-[#1E3A5F]/10 bg-[#FAFAFA] p-5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-[#1E3A5F]">
                              #{race.raceNumber} {race.name}
                            </h3>
                            <p className="mt-1 text-sm text-[#1E3A5F]/55">
                              {race.description}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-[#D4A017]/10 px-3 py-1 text-sm font-semibold text-[#D4A017]">
                            {race.status}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#1E3A5F]/65">
                          <span>
                            <Flag className="mr-2 inline-block h-4 w-4 text-[#D4A017]" />
                            {race.distance}m
                          </span>
                          <span>
                            <CalendarDays className="mr-2 inline-block h-4 w-4 text-[#D4A017]" />
                            {formatDate(race.scheduledAt)}
                          </span>
                          <span>
                            <Trophy className="mr-2 inline-block h-4 w-4 text-[#D4A017]" />
                            {(race.results || []).length} kết quả
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[#1E3A5F]/10 bg-white p-6">
                <h2 className="mb-4 text-2xl font-bold text-[#1E3A5F]">
                  Luật giải
                </h2>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-[#1E3A5F]/70">
                  {tournament.rules || "Chưa có luật giải đấu."}
                </pre>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-[#1E3A5F]/10 bg-[#1E3A5F] p-6 text-white">
                <h2 className="text-2xl font-bold">Tham gia ngay</h2>
                <p className="mt-3 text-white/75">
                  Đăng ký giải đấu và chọn jockey phù hợp cho ngựa của bạn.
                </p>
                <div className="mt-6 space-y-3">
                  <Link
                    to={`/tournaments/${tournament.id}/register`}
                    className="block rounded-2xl bg-[#D4A017] px-4 py-3 text-center font-semibold text-white"
                  >
                    Đăng ký tham gia
                  </Link>
                  <Link
                    to={`/tournaments/${tournament.id}/results`}
                    className="block rounded-2xl border border-white/15 px-4 py-3 text-center font-semibold text-white/90"
                  >
                    Xem kết quả
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-[#1E3A5F]/10 bg-white p-6">
                <h3 className="text-xl font-bold text-[#1E3A5F]">
                  Thống kê nhanh
                </h3>
                <div className="mt-4 space-y-3 text-sm text-[#1E3A5F]/65">
                  <MetaRow
                    label="Số cuộc đua"
                    value={String(tournament.raceCount || 0)}
                  />
                  <MetaRow
                    label="Đăng ký"
                    value={String(tournament.registrationCount || 0)}
                  />
                  <MetaRow label="Trạng thái" value={tournament.status} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-3xl border border-[#1E3A5F]/10 bg-[#FAFAFA] p-5">
      <Icon className="h-6 w-6 text-[#D4A017]" />
      <p className="mt-3 text-sm font-semibold text-[#1E3A5F]/55">{title}</p>
      <p className="mt-2 text-lg font-semibold text-[#1E3A5F]">{value}</p>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#1E3A5F]/10 bg-[#FAFAFA] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1E3A5F]/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#1E3A5F]">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAFAFA] px-4 py-3">
      <span>{label}</span>
      <span className="font-semibold text-[#1E3A5F]">{value}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString("vi-VN")} VNĐ`;
}

function booleanText(value) {
  return value ? "Có" : "Không";
}
