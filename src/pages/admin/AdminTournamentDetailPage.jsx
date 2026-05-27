import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Flag,
  MapPin,
  PlusCircle,
  RotateCw,
  Save,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { FormCard, FormCardHeader } from "@/components/admin/ui/Card";
import Field from "@/components/admin/ui/Field";
import { Input, TextArea } from "@/components/admin/ui/Input";
import {
  controlClass,
  primaryButtonLg,
  secondaryButton,
} from "@/components/admin/ui/styles";
import { tournamentApi } from "@/api/tournamentApi";
import { userApi } from "@/api/userApi";

const defaultResultJson =
  '[\n  { "position": 1, "horseName": "Bạch Long", "jockeyName": "Trần Minh Jockey", "time": "01:12.41", "points": 10 },\n  { "position": 2, "horseName": "Hắc Mã", "jockeyName": "Lê Quốc Jockey", "time": "01:13.18", "points": 8 }\n]';

export default function AdminTournamentDetailPage() {
  const { id = "" } = useParams();
  const [tournament, setTournament] = useState(null);
  const [jockeys, setJockeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingRace, setSavingRace] = useState(false);
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [configForm, setConfigForm] = useState({
    type: "regular",
    status: "Nháp",
    rules: "",
    entryFee: 0,
    depositFee: 0,
    refundDays: 3,
    maxRaces: 0,
    maxRegistrations: 0,
    requireJockey: true,
    requireHorseOwner: true,
    requireVetCheck: true,
    requireDopingCheck: true,
    allowLateRegistration: false,
  });
  const [raceForm, setRaceForm] = useState({
    raceNumber: "",
    name: "",
    distance: "",
    scheduledAt: "",
    status: "Nháp",
    description: "",
  });
  const [registrationForm, setRegistrationForm] = useState({
    fullName: "",
    horseName: "",
    horseAge: "",
    horseBreed: "",
    jockeyId: "",
    jockeyName: "",
    raceId: "",
    notes: "",
  });
  const [resultForm, setResultForm] = useState({
    raceId: "",
    status: "Hoàn thành",
    tournamentStatus: "Đã kết thúc",
    resultsJson: defaultResultJson,
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
        toast.error("Không thể tải chi tiết giải đấu");
        setTournament(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  useEffect(() => {
    if (!tournament) return;
    setConfigForm({
      type: tournament.type || "regular",
      status: tournament.status || "Nháp",
      rules: tournament.rules || "",
      entryFee: tournament.config?.entryFee ?? 0,
      depositFee: tournament.config?.depositFee ?? 0,
      refundDays: tournament.config?.refundDays ?? 3,
      maxRaces: tournament.config?.maxRaces ?? 0,
      maxRegistrations: tournament.config?.maxRegistrations ?? 0,
      requireJockey: tournament.config?.requireJockey ?? true,
      requireHorseOwner: tournament.config?.requireHorseOwner ?? true,
      requireVetCheck: tournament.config?.requireVetCheck ?? true,
      requireDopingCheck: tournament.config?.requireDopingCheck ?? true,
      allowLateRegistration: tournament.config?.allowLateRegistration ?? false,
    });
    setRaceForm((previous) => ({
      ...previous,
      raceNumber: String((tournament.races?.length || 0) + 1),
    }));
    setResultForm((previous) => ({
      ...previous,
      raceId: tournament.races?.[0]?.id || "",
      tournamentStatus: tournament.status || "Đã kết thúc",
    }));
    setRegistrationForm((previous) => ({
      ...previous,
      raceId: tournament.races?.[0]?.id || "",
    }));
  }, [tournament]);

  useEffect(() => {
    if (!registrationForm.jockeyId) return;
    const selected = jockeys.find(
      (item) => item.id === registrationForm.jockeyId,
    );
    setRegistrationForm((previous) => ({
      ...previous,
      jockeyName: selected?.fullName || selected?.name || "",
    }));
  }, [registrationForm.jockeyId, jockeys]);

  const selectedRace = useMemo(
    () =>
      tournament?.races?.find((race) => race.id === resultForm.raceId) || null,
    [resultForm.raceId, tournament],
  );

  async function reloadTournament() {
    const refreshed = await tournamentApi.getById(id);
    setTournament(refreshed);
  }

  async function saveConfig(event) {
    event.preventDefault();
    try {
      setSavingConfig(true);
      await tournamentApi.updateConfig(id, {
        type: configForm.type,
        status: configForm.status,
        rules: configForm.rules,
        config: {
          entryFee: Number(configForm.entryFee || 0),
          depositFee: Number(configForm.depositFee || 0),
          refundDays: Number(configForm.refundDays || 0),
          maxRaces: Number(configForm.maxRaces || 0),
          maxRegistrations: Number(configForm.maxRegistrations || 0),
          requireJockey: configForm.requireJockey,
          requireHorseOwner: configForm.requireHorseOwner,
          requireVetCheck: configForm.requireVetCheck,
          requireDopingCheck: configForm.requireDopingCheck,
          allowLateRegistration: configForm.allowLateRegistration,
        },
      });
      await reloadTournament();
      toast.success("Đã lưu cấu hình giải đấu");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu cấu hình");
    } finally {
      setSavingConfig(false);
    }
  }

  async function addRace(event) {
    event.preventDefault();
    try {
      setSavingRace(true);
      await tournamentApi.addRace(id, {
        raceNumber: Number(raceForm.raceNumber || 0),
        name: raceForm.name,
        distance: Number(raceForm.distance || 0),
        scheduledAt: raceForm.scheduledAt,
        status: raceForm.status,
        description: raceForm.description,
      });
      setRaceForm({
        raceNumber: "",
        name: "",
        distance: "",
        scheduledAt: "",
        status: "Nháp",
        description: "",
      });
      await reloadTournament();
      toast.success("Đã thêm cuộc đua");
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm cuộc đua");
    } finally {
      setSavingRace(false);
    }
  }

  async function addRegistration(event) {
    event.preventDefault();
    try {
      setSavingRegistration(true);
      await tournamentApi.addRegistration(id, {
        fullName: registrationForm.fullName,
        horseName: registrationForm.horseName,
        horseAge: registrationForm.horseAge,
        horseBreed: registrationForm.horseBreed,
        jockeyId: registrationForm.jockeyId,
        jockeyName: registrationForm.jockeyName,
        raceId: registrationForm.raceId,
        notes: registrationForm.notes,
      });
      setRegistrationForm({
        fullName: "",
        horseName: "",
        horseAge: "",
        horseBreed: "",
        jockeyId: "",
        jockeyName: "",
        raceId: tournament?.races?.[0]?.id || "",
        notes: "",
      });
      await reloadTournament();
      toast.success("Đã thêm đăng ký tham gia");
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm đăng ký");
    } finally {
      setSavingRegistration(false);
    }
  }

  async function saveResults(event) {
    event.preventDefault();
    try {
      setSavingResult(true);
      const parsedResults = JSON.parse(resultForm.resultsJson);
      await tournamentApi.addResults(id, resultForm.raceId, {
        results: parsedResults,
        status: resultForm.status,
        tournamentStatus: resultForm.tournamentStatus,
      });
      await reloadTournament();
      toast.success("Đã lưu kết quả cuộc đua");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu kết quả. Kiểm tra JSON đầu vào.");
    } finally {
      setSavingResult(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-10 text-white/55">
          Đang tải chi tiết giải đấu...
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-10 text-white/55">
          Không tìm thấy giải đấu.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      heading="Quản lý"
      highlight={tournament.name}
      subtitle="Cấu hình giải đấu, thêm cuộc đua, đăng ký tham gia và cập nhật kết quả"
    >
      <section className="mb-8 grid gap-5 md:grid-cols-4">
        <Stat label="Giải đấu" value={tournament.name} icon={Trophy} />
        <Stat
          label="Cuộc đua"
          value={String(tournament.raceCount || 0)}
          icon={Flag}
        />
        <Stat
          label="Đăng ký"
          value={String(tournament.registrationCount || 0)}
          icon={Users}
        />
        <Stat label="Địa điểm" value={tournament.location} icon={MapPin} />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <FormCard>
          <FormCardHeader
            icon={Save}
            title="Cấu hình giải đấu"
            subtitle="Áp dụng cho giải thường hoặc giải chính"
          />
          <form className="grid gap-5 p-8" onSubmit={saveConfig}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Loại giải">
                <select
                  value={configForm.type}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      type: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option value="regular">Giải thường</option>
                  <option value="championship">Giải chính</option>
                </select>
              </Field>
              <Field label="Trạng thái">
                <select
                  value={configForm.status}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option>Nháp</option>
                  <option>Đang mở đăng ký</option>
                  <option>Đang diễn ra</option>
                  <option>Đã kết thúc</option>
                </select>
              </Field>
            </div>
            <Field label="Luật giải" full>
              <textarea
                rows={5}
                value={configForm.rules}
                onChange={(event) =>
                  setConfigForm((previous) => ({
                    ...previous,
                    rules: event.target.value,
                  }))
                }
                className={`${controlClass} h-auto resize-none py-4`}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Phí vào cửa">
                <Input
                  type="number"
                  variant="form"
                  value={configForm.entryFee}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      entryFee: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Phí đặt cọc">
                <Input
                  type="number"
                  variant="form"
                  value={configForm.depositFee}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      depositFee: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Hoàn cọc sau (ngày)">
                <Input
                  type="number"
                  variant="form"
                  value={configForm.refundDays}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      refundDays: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Tối đa cuộc đua">
                <Input
                  type="number"
                  variant="form"
                  value={configForm.maxRaces}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      maxRaces: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Tối đa đăng ký">
                <Input
                  type="number"
                  variant="form"
                  value={configForm.maxRegistrations}
                  onChange={(event) =>
                    setConfigForm((previous) => ({
                      ...previous,
                      maxRegistrations: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                label="Yêu cầu jockey"
                checked={configForm.requireJockey}
                onChange={(checked) =>
                  setConfigForm((previous) => ({
                    ...previous,
                    requireJockey: checked,
                  }))
                }
              />
              <ToggleField
                label="Yêu cầu chủ ngựa"
                checked={configForm.requireHorseOwner}
                onChange={(checked) =>
                  setConfigForm((previous) => ({
                    ...previous,
                    requireHorseOwner: checked,
                  }))
                }
              />
              <ToggleField
                label="Kiểm tra y tế"
                checked={configForm.requireVetCheck}
                onChange={(checked) =>
                  setConfigForm((previous) => ({
                    ...previous,
                    requireVetCheck: checked,
                  }))
                }
              />
              <ToggleField
                label="Kiểm tra doping"
                checked={configForm.requireDopingCheck}
                onChange={(checked) =>
                  setConfigForm((previous) => ({
                    ...previous,
                    requireDopingCheck: checked,
                  }))
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className={`${primaryButtonLg} disabled:cursor-not-allowed disabled:bg-[#a48123] disabled:text-white/50`}
              >
                <Save className="h-5 w-5" />
                {savingConfig ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </FormCard>

        <FormCard>
          <FormCardHeader
            icon={PlusCircle}
            title="Thêm cuộc đua"
            subtitle="Tạo các chặng đua bên trong giải"
          />
          <form className="grid gap-5 p-8" onSubmit={addRace}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số chặng">
                <Input
                  type="number"
                  variant="form"
                  value={raceForm.raceNumber}
                  onChange={(event) =>
                    setRaceForm((previous) => ({
                      ...previous,
                      raceNumber: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Tên cuộc đua">
                <Input
                  variant="form"
                  value={raceForm.name}
                  onChange={(event) =>
                    setRaceForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Khoảng cách (m)">
                <Input
                  type="number"
                  variant="form"
                  value={raceForm.distance}
                  onChange={(event) =>
                    setRaceForm((previous) => ({
                      ...previous,
                      distance: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Ngày giờ chạy">
                <Input
                  type="datetime-local"
                  variant="form"
                  value={raceForm.scheduledAt}
                  onChange={(event) =>
                    setRaceForm((previous) => ({
                      ...previous,
                      scheduledAt: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Trạng thái">
              <select
                value={raceForm.status}
                onChange={(event) =>
                  setRaceForm((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                className={controlClass}
              >
                <option>Nháp</option>
                <option>Sắp chạy</option>
                <option>Đang chạy</option>
                <option>Hoàn thành</option>
              </select>
            </Field>
            <Field label="Mô tả" full>
              <TextArea
                variant="form"
                value={raceForm.description}
                onChange={(event) =>
                  setRaceForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Mô tả nội dung cuộc đua"
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingRace}
                className={`${secondaryButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <PlusCircle className="h-5 w-5" />
                {savingRace ? "Đang thêm..." : "Thêm cuộc đua"}
              </button>
            </div>
          </form>
        </FormCard>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <FormCard>
          <FormCardHeader
            icon={Users}
            title="Đăng ký tham gia"
            subtitle="Kèm theo jockey cho từng ngựa"
          />
          <form className="grid gap-5 p-8" onSubmit={addRegistration}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Người đăng ký">
                <Input
                  variant="form"
                  value={registrationForm.fullName}
                  onChange={(event) =>
                    setRegistrationForm((previous) => ({
                      ...previous,
                      fullName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Tên ngựa">
                <Input
                  variant="form"
                  value={registrationForm.horseName}
                  onChange={(event) =>
                    setRegistrationForm((previous) => ({
                      ...previous,
                      horseName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Tuổi ngựa">
                <Input
                  type="number"
                  variant="form"
                  value={registrationForm.horseAge}
                  onChange={(event) =>
                    setRegistrationForm((previous) => ({
                      ...previous,
                      horseAge: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Giống ngựa">
                <Input
                  variant="form"
                  value={registrationForm.horseBreed}
                  onChange={(event) =>
                    setRegistrationForm((previous) => ({
                      ...previous,
                      horseBreed: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Jockey">
              <select
                value={registrationForm.jockeyId}
                onChange={(event) =>
                  setRegistrationForm((previous) => ({
                    ...previous,
                    jockeyId: event.target.value,
                  }))
                }
                className={controlClass}
              >
                <option value="">Chọn jockey</option>
                {jockeys.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName || item.name} ({item.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cuộc đua">
              <select
                value={registrationForm.raceId}
                onChange={(event) =>
                  setRegistrationForm((previous) => ({
                    ...previous,
                    raceId: event.target.value,
                  }))
                }
                className={controlClass}
              >
                <option value="">Chọn cuộc đua</option>
                {(tournament.races || []).map((race) => (
                  <option key={race.id} value={race.id}>
                    #{race.raceNumber} {race.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ghi chú" full>
              <TextArea
                variant="form"
                value={registrationForm.notes}
                onChange={(event) =>
                  setRegistrationForm((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingRegistration}
                className={`${secondaryButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {savingRegistration ? "Đang lưu..." : "Thêm đăng ký"}
              </button>
            </div>
          </form>
        </FormCard>

        <FormCard>
          <FormCardHeader
            icon={RotateCw}
            title="Nhập kết quả cuộc đua"
            subtitle="Dùng JSON array để lưu kết quả nhanh"
          />
          <form className="grid gap-5 p-8" onSubmit={saveResults}>
            <Field label="Cuộc đua">
              <select
                value={resultForm.raceId}
                onChange={(event) =>
                  setResultForm((previous) => ({
                    ...previous,
                    raceId: event.target.value,
                  }))
                }
                className={controlClass}
              >
                <option value="">Chọn cuộc đua</option>
                {(tournament.races || []).map((race) => (
                  <option key={race.id} value={race.id}>
                    #{race.raceNumber} {race.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Trạng thái cuộc đua">
                <select
                  value={resultForm.status}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option>Hoàn thành</option>
                  <option>Đang chạy</option>
                  <option>Sắp chạy</option>
                </select>
              </Field>
              <Field label="Trạng thái giải đấu">
                <select
                  value={resultForm.tournamentStatus}
                  onChange={(event) =>
                    setResultForm((previous) => ({
                      ...previous,
                      tournamentStatus: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option>Đã kết thúc</option>
                  <option>Đang diễn ra</option>
                  <option>Đang mở đăng ký</option>
                </select>
              </Field>
            </div>
            <Field label="Kết quả JSON" full>
              <textarea
                rows={12}
                value={resultForm.resultsJson}
                onChange={(event) =>
                  setResultForm((previous) => ({
                    ...previous,
                    resultsJson: event.target.value,
                  }))
                }
                className={`${controlClass} h-auto resize-none font-mono text-sm leading-7`}
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingResult}
                className={`${primaryButtonLg} disabled:cursor-not-allowed disabled:bg-[#a48123] disabled:text-white/50`}
              >
                <Save className="h-5 w-5" />
                {savingResult ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </form>
        </FormCard>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Cuộc đua hiện có</h2>
            <p className="mt-1 text-sm text-white/55">
              {selectedRace
                ? `Đang chọn #${selectedRace.raceNumber} ${selectedRace.name}`
                : "Chưa có cuộc đua được chọn"}
            </p>
          </div>
          <Link
            to={`/tournaments/${tournament.id}`}
            className="font-semibold text-[#dda50e] hover:text-[#ebbc37]"
          >
            Xem trang công khai
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(tournament.races || []).map((race) => (
            <div
              key={race.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold">
                  #{race.raceNumber} {race.name}
                </h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  {race.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/55">{race.description}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-white/45">
                <span>{race.distance}m</span>
                <span>·</span>
                <span>{(race.results || []).length} kết quả</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
      <div className="mb-4 flex items-center gap-3 text-white/60">
        <Icon className="h-5 w-5 text-[#dda50e]" />
        <span className="text-sm uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
