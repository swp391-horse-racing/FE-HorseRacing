import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Info, MapPin, Save, Trophy } from "lucide-react";
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
import { createSlug } from "@/utils/createSlug";

const defaultRules =
  "1. Ngựa phải có giấy chứng nhận sức khỏe hợp lệ.\n2. Jockey phải có chứng chỉ FIA hoặc tương đương.\n3. Tiền phí hoàn lại sau khi giải đấu kết thúc.\n4. Kiểm tra doping bắt buộc với ngựa thắng cuộc.";

export default function AdminTournamentCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "Nháp",
    type: "regular",
    rules: defaultRules,
    banner:
      "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    config: {
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
    },
  });

  const slug = createSlug(form.name);
  const valid =
    form.name.trim().length > 3 &&
    form.location.trim().length > 0 &&
    form.startDate &&
    form.endDate &&
    form.startDate <= form.endDate;

  const update = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const updateConfig = (key, value) =>
    setForm((previous) => ({
      ...previous,
      config: { ...previous.config, [key]: value },
    }));

  const createTournament = async () => {
    if (!valid) return;

    try {
      setSaving(true);
      const created = await tournamentApi.create({
        name: form.name,
        slug: slug || `giai-dau-${Date.now()}`,
        description: form.description,
        location: form.location,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        type: form.type,
        rules: form.rules,
        banner: form.banner,
        config: {
          ...form.config,
          entryFee: Number(form.config.entryFee || 0),
          depositFee: Number(form.config.depositFee || 0),
          refundDays: Number(form.config.refundDays || 0),
          maxRaces: Number(form.config.maxRaces || 0),
          maxRegistrations: Number(form.config.maxRegistrations || 0),
        },
      });
      toast.success("Tạo giải đấu thành công");
      navigate(`/admin/tournaments/${created.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo giải đấu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      heading="Tạo"
      highlight="Giải đấu mới"
      subtitle="Bước 1: Khởi tạo giải đấu"
      action={
        <div className="flex flex-wrap gap-4">
          <button type="button" className={secondaryButton}>
            <Save className="h-5 w-5" />
            Lưu nháp
          </button>
          <button
            type="button"
            disabled={!valid || saving}
            onClick={createTournament}
            className={`${primaryButtonLg} disabled:cursor-not-allowed disabled:bg-[#a48123] disabled:text-white/50 disabled:shadow-none`}
          >
            <CheckCircle2 className="h-5 w-5" />
            {saving ? "Đang tạo..." : "Tạo giải đấu"}
          </button>
        </div>
      }
    >
      <section className="mb-9 flex gap-5 rounded-3xl border border-[#dda50e]/20 bg-gradient-to-r from-[#dda50e]/10 to-white/[0.045] p-7 text-white/72">
        <Info className="h-7 w-7 shrink-0 text-[#dda50e]" />
        <p className="text-base leading-7">
          Trang này tạo giải đấu thật xuống backend và kèm luôn phần cấu hình cơ
          bản cho giải thường hoặc giải chính.
        </p>
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[2.05fr_1fr]">
        <FormCard>
          <FormCardHeader
            icon={Trophy}
            title="Thông tin giải đấu"
            subtitle="Các trường có (*) bắt buộc"
          />
          <form
            className="grid gap-7 p-8 md:grid-cols-2"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field label="Tên giải đấu *" full>
              <Input
                variant="form"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="VD: Vietnam Grand Prix 2026"
              />
            </Field>
            <Field label="Mô tả ngắn" full>
              <TextArea
                variant="form"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Giới thiệu tổng quan giải đấu..."
              />
            </Field>
            <Field label="Địa điểm *" full>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#dda50e]" />
                <Input
                  variant="form"
                  className="pl-14"
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                  placeholder="Sân đua Phú Thọ, TP. HCM"
                />
              </div>
            </Field>
            <Field label="Ngày bắt đầu *">
              <Input
                type="date"
                variant="form"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </Field>
            <Field label="Ngày kết thúc *">
              <Input
                type="date"
                variant="form"
                value={form.endDate}
                onChange={(event) => update("endDate", event.target.value)}
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
                className={controlClass}
              >
                <option className="bg-[#162338] text-white">Nháp</option>
                <option className="bg-[#162338] text-white">
                  Đang mở đăng ký
                </option>
                <option className="bg-[#162338] text-white">
                  Đang diễn ra
                </option>
                <option className="bg-[#162338] text-white">Đã kết thúc</option>
              </select>
            </Field>
            <Field label="Loại giải đấu">
              <select
                value={form.type}
                onChange={(event) => update("type", event.target.value)}
                className={controlClass}
              >
                <option value="regular" className="bg-[#162338] text-white">
                  Giải thường
                </option>
                <option
                  value="championship"
                  className="bg-[#162338] text-white"
                >
                  Giải chính
                </option>
              </select>
            </Field>
            <Field label="Mã giải đấu">
              <Input
                variant="form"
                disabled
                value={slug}
                placeholder="Tự sinh từ tên"
              />
            </Field>
            <Field label="Tóm tắt luật giải đấu" full icon={Info}>
              <textarea
                rows={6}
                value={form.rules}
                onChange={(event) => update("rules", event.target.value)}
                className={`${controlClass} h-auto resize-none py-4 leading-7`}
              />
            </Field>
          </form>
        </FormCard>

        <div className="space-y-8">
          <FormCard className="p-7">
            <p className="mb-4 text-white/55">Xem trước banner</p>
            <img
              src={form.banner}
              alt=""
              className="h-64 w-full rounded-2xl object-cover"
            />
          </FormCard>

          <FormCard className="p-7">
            <p className="mb-4 text-white/55">Cấu hình cơ bản</p>
            <div className="grid gap-4">
              <Field label="Phí vào cửa">
                <Input
                  type="number"
                  variant="form"
                  value={form.config.entryFee}
                  onChange={(event) =>
                    updateConfig("entryFee", event.target.value)
                  }
                />
              </Field>
              <Field label="Phí đặt cọc">
                <Input
                  type="number"
                  variant="form"
                  value={form.config.depositFee}
                  onChange={(event) =>
                    updateConfig("depositFee", event.target.value)
                  }
                />
              </Field>
              <Field label="Hoàn cọc sau (ngày)">
                <Input
                  type="number"
                  variant="form"
                  value={form.config.refundDays}
                  onChange={(event) =>
                    updateConfig("refundDays", event.target.value)
                  }
                />
              </Field>
              <Field label="Tối đa cuộc đua">
                <Input
                  type="number"
                  variant="form"
                  value={form.config.maxRaces}
                  onChange={(event) =>
                    updateConfig("maxRaces", event.target.value)
                  }
                />
              </Field>
              <Field label="Tối đa đăng ký">
                <Input
                  type="number"
                  variant="form"
                  value={form.config.maxRegistrations}
                  onChange={(event) =>
                    updateConfig("maxRegistrations", event.target.value)
                  }
                />
              </Field>
            </div>
          </FormCard>
        </div>
      </div>
    </AdminLayout>
  );
}
