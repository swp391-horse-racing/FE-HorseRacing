import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, User, Users } from "lucide-react";
import { toast } from "sonner";
import { tournamentApi } from "@/api/tournamentApi";
import { userApi } from "@/api/userApi";

export default function TournamentRegisterPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [jockeys, setJockeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    horseName: "",
    horseAge: "",
    horseBreed: "",
    jockeyId: "",
    jockeyName: "",
    raceId: "",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [tournamentData, jockeyData] = await Promise.all([
          tournamentApi.getById(id),
          userApi.getByRole("JOCKEY").catch(() => []),
        ]);
        setTournament(tournamentData);
        setJockeys(Array.isArray(jockeyData) ? jockeyData : []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải dữ liệu đăng ký");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  useEffect(() => {
    if (!form.jockeyId) return;
    const selected = jockeys.find((item) => item.id === form.jockeyId);
    setForm((previous) => ({
      ...previous,
      jockeyName: selected?.fullName || selected?.name || "",
    }));
  }, [form.jockeyId, jockeys]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName,
        horseName: form.horseName,
        horseAge: form.horseAge,
        horseBreed: form.horseBreed,
        jockeyId: form.jockeyId,
        jockeyName: form.jockeyName,
        raceId: form.raceId,
        notes: form.notes,
      };
      await tournamentApi.addRegistration(id, payload);
      toast.success("Đăng ký tham gia thành công");
      navigate(`/tournaments/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo đăng ký");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[#1E3A5F]/55">
        Đang tải dữ liệu đăng ký...
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
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to={`/tournaments/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A5F]/60 hover:text-[#D4A017]"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại giải đấu
        </Link>
        <div className="rounded-[2rem] border border-[#1E3A5F]/10 bg-white p-8 shadow-2xl shadow-[#1E3A5F]/5">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-[#D4A017]/10 px-4 py-1 text-sm font-semibold text-[#D4A017]">
              Đăng ký tham gia
            </div>
            <h1 className="text-3xl font-bold text-[#1E3A5F] md:text-5xl">
              {tournament.name}
            </h1>
            <p className="mt-3 text-[#1E3A5F]/60">
              Chọn chủ ngựa, ngựa và jockey tham gia giải đấu.
            </p>
          </div>

          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field
              label="Họ tên người đăng ký"
              value={form.fullName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  fullName: event.target.value,
                }))
              }
              placeholder="Nguyễn Văn A"
            />
            <Field
              label="Tên ngựa"
              value={form.horseName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  horseName: event.target.value,
                }))
              }
              placeholder="Bạch Long"
            />
            <Field
              label="Tuổi ngựa"
              type="number"
              value={form.horseAge}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  horseAge: event.target.value,
                }))
              }
              placeholder="5"
            />
            <Field
              label="Giống ngựa"
              value={form.horseBreed}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  horseBreed: event.target.value,
                }))
              }
              placeholder="Thoroughbred"
            />
            <SelectField
              label="Jockey"
              value={form.jockeyId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  jockeyId: event.target.value,
                }))
              }
            >
              <option value="">Chọn jockey</option>
              {jockeys.map((jockey) => (
                <option key={jockey.id} value={jockey.id}>
                  {jockey.fullName || jockey.name} ({jockey.email})
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Cuộc đua"
              value={form.raceId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  raceId: event.target.value,
                }))
              }
            >
              <option value="">Chọn cuộc đua</option>
              {(tournament.races || []).map((race) => (
                <option key={race.id} value={race.id}>
                  #{race.raceNumber} {race.name}
                </option>
              ))}
            </SelectField>
            <div className="md:col-span-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#1E3A5F]">
                  Ghi chú
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full rounded-2xl border border-[#1E3A5F]/10 px-4 py-3 outline-none focus:border-[#D4A017]"
                  placeholder="Thông tin thêm về ngựa hoặc jockey"
                />
              </label>
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D4A017] px-5 py-4 font-semibold text-white transition hover:bg-[#B8941F] disabled:cursor-not-allowed disabled:bg-[#ccb15f]"
              >
                <CheckCircle2 className="h-5 w-5" />
                {saving ? "Đang lưu..." : "Gửi đăng ký"}
              </button>
              <Link
                to={`/tournaments/${id}`}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#1E3A5F]/10 px-5 py-4 font-semibold text-[#1E3A5F] transition hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1E3A5F]">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-[#1E3A5F]/10 px-4 py-3 outline-none focus:border-[#D4A017]"
      />
    </label>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1E3A5F]">
        {label}
      </span>
      <select
        {...props}
        className="w-full rounded-2xl border border-[#1E3A5F]/10 px-4 py-3 outline-none focus:border-[#D4A017]"
      >
        {children}
      </select>
    </label>
  );
}
