import { useEffect, useState } from "react";
import { User, Edit2, Save, X } from "lucide-react";
import { HorseOwnerLayout } from "./HorseOwnerLayout";
import {
  GlassCard,
  PrimaryButton,
  GhostButton,
  TextInput,
} from "../admin/AdminLayout";
import { toast } from "sonner";
import {
  HorseOwnerProfileField,
  HorseOwnerProfileValue,
} from "./components/HorseOwnerProfileField";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import { useAuthStore } from "@/store/authStore";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDate } from "@/utils/dateFormat";

function formatDate(value) {
  return formatDisplayDate(value, "—");
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function buildFormFromUser(user) {
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
  };
}

export function HorseOwnerProfile() {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [form, setForm] = useState(() => buildFormFromUser(user));

  useEffect(() => {
    fetchProfile()
      .then((fresh) => setForm(buildFormFromUser(fresh)))
      .catch(() => {});
  }, [fetchProfile]);

  const displayName = user?.fullName || user?.username || "Chủ ngựa";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleCancel = () => {
    setForm(buildFormFromUser(user));
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateProfile({
        fullName: form.fullName.trim() || null,
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
      });
      const fresh = await fetchProfile();
      setForm(buildFormFromUser(fresh));
      setEditing(false);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <HorseOwnerLayout
      title="Horse Owner · Hồ sơ cá nhân"
      subtitle="Quản lý thông tin cá nhân và tài khoản"
      actions={
        editing ? (
          <>
            <GhostButton icon={X} onClick={handleCancel} disabled={saving}>
              Hủy
            </GhostButton>
            <PrimaryButton icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton icon={Edit2} onClick={() => setEditing(true)}>
            Chỉnh sửa
          </PrimaryButton>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#D4A017]/30 to-[#0F1E3A] flex items-center justify-center text-5xl font-bold text-[#D4A017] border-2 border-[#D4A017]/30 overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarLetter
              )}
            </div>
          </div>
          <h2 className="font-bold text-white text-lg">{displayName}</h2>
          <p className="text-sm text-[#D4A017] font-semibold mt-1">Horse Owner</p>
          <p className="text-xs text-white/50 mt-2">
            Thành viên từ {formatDate(user?.createdAt)}
          </p>
        </GlassCard>

        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#D4A017]" />
              Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HorseOwnerProfileField label="Họ và tên">
                {editing ? (
                  <TextInput
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                ) : (
                  <HorseOwnerProfileValue>
                    {form.fullName || "—"}
                  </HorseOwnerProfileValue>
                )}
              </HorseOwnerProfileField>
              <HorseOwnerProfileField label="Email">
                <HorseOwnerProfileValue>{form.email || "—"}</HorseOwnerProfileValue>
              </HorseOwnerProfileField>
              <HorseOwnerProfileField label="Số điện thoại">
                {editing ? (
                  <TextInput
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                ) : (
                  <HorseOwnerProfileValue>{form.phone || "—"}</HorseOwnerProfileValue>
                )}
              </HorseOwnerProfileField>
              <HorseOwnerProfileField label="Địa chỉ" className="sm:col-span-2">
                {editing ? (
                  <TextInput
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                ) : (
                  <HorseOwnerProfileValue>
                    {form.location || "—"}
                  </HorseOwnerProfileValue>
                )}
              </HorseOwnerProfileField>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-5">Bảo mật tài khoản</h3>
            <div className="flex items-center justify-between p-3 bg-white/[0.04] rounded-xl">
              <div>
                <div className="text-sm font-semibold text-white">Mật khẩu</div>
                <div className="text-xs text-white/50">
                  Cập nhật lần cuối: {formatDate(user?.updatedAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="text-xs text-[#D4A017] hover:underline font-semibold"
              >
                Đổi mật khẩu
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </HorseOwnerLayout>
  );
}
