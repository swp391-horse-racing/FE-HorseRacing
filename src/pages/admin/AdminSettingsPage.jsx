import { useState } from 'react'
import { DollarSign, FileText, MapPin, Ruler, Settings } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import LocationSettingsPanel from '@/components/admin/LocationSettingsPanel'
import RaceDistanceSettingsPanel from '@/components/admin/RaceDistanceSettingsPanel'
import DefaultRulesSettingsPanel from '@/components/admin/DefaultRulesSettingsPanel'
import Field from '@/components/ui/Field'
import { inputClass } from '@/components/ui/styles'

const tabs = [
  { key: 'fees', label: 'Lệ phí mặc định', icon: DollarSign },
  { key: 'rules', label: 'Luật mặc định', icon: FileText },
  { key: 'locations', label: 'Tỉnh & địa điểm đua', icon: MapPin },
  { key: 'race-distances', label: 'Khoảng cách đua', icon: Ruler },
]

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('fees')

  return (
    <AdminLayout
      heading="Cài đặt"
      highlight="Hệ thống"
      subtitle="Cấu hình mặc định dùng chung cho toàn bộ nền tảng admin"
    >
      <section className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.045] p-2">
        {tabs.map((item) => {
          const Icon = item.icon
          const active = tab === item.key

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-[#dda50e] text-white ring-1 ring-[#f0c14b]/35'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.045]">
        <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dda50e]/15 text-[#dda50e]">
            <Settings className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{tabs.find((item) => item.key === tab)?.label}</h2>
            <p className="text-sm text-white/50">Thiết lập nhanh theo module</p>
          </div>
        </div>

        {tab === 'locations' ? (
          <LocationSettingsPanel />
        ) : tab === 'race-distances' ? (
          <RaceDistanceSettingsPanel />
        ) : tab === 'rules' ? (
          <DefaultRulesSettingsPanel />
        ) : (
        <div className="grid gap-5 p-6 md:grid-cols-2">
          {tab === 'fees' && (
            <>
              <Field label="Lệ phí đăng ký mặc định (VNĐ)">
                <input type="number" defaultValue={5000000} className={inputClass} />
              </Field>
              <Field label="Phí trễ hạn (VNĐ)">
                <input type="number" defaultValue={500000} className={inputClass} />
              </Field>
            </>
          )}
        </div>
        )}

        {!['locations', 'race-distances', 'rules'].includes(tab) && (
          <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5">
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-semibold text-white/70 transition hover:bg-white/[0.08]"
          >
            Hủy
          </button>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl bg-[#dda50e] px-5 font-semibold text-white transition hover:bg-[#c8940f]"
          >
            Lưu cài đặt
          </button>
        </div>
        )}
      </section>
    </AdminLayout>
  )
}
