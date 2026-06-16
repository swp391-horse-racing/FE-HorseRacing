import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Flag,
  Clock,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Ban,
  AlertOctagon,
  Upload,
  Camera,
  FileText,
  Plus,
  Send,
  Crown,
  Medal,
  Lock,
  ArrowRight,
  Sparkles,
  Thermometer,
  Activity,
  Gavel,
  ShieldCheck,
  Info,
  Save,
  Timer,
} from 'lucide-react';
import { RefereeLayout } from './RefereeLayout';
import { GlassCard, Pill, PrimaryButton, GhostButton, TextInput, Select } from '../admin/AdminLayout';
import {
  buildHorses,
  addViolation,
  violations as allViolations,
  checkinTone,
  raceStatusTone,
  severityTone,
} from './data';
import { useAssignedRaces } from './useAssignedRaces';


const TABS = [
  { k: 'overview', label: 'Tổng quan', icon: Info },
  { k: 'checkin', label: 'Check-in ngựa', icon: ClipboardCheck },
  { k: 'violations', label: 'Vi phạm', icon: AlertTriangle },
  { k: 'results', label: 'Kết quả', icon: Award },
  { k: 'progression', label: 'Tiến vòng', icon: Trophy },
];

export function RefereeRaceDetail() {
  const { pathname } = useLocation();
  const id = pathname.split('/').filter(Boolean)[2];
  const navigate = useNavigate();
  const assignedRaces = useAssignedRaces();
  const race = assignedRaces.find((item) => String(item.id) === String(id));
  const [tab, setTab] = useState('overview');

  if (!race) {
    return (
      <RefereeLayout title="Không tìm thấy" subtitle="Race không tồn tại hoặc bạn không được phân công">
        <div className="text-center py-20 text-white/50">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Race ID "{id}" không có trong danh sách của bạn.</p>
          <button onClick={() => navigate('/referee/races')} className="mt-4 text-[#D4A017] hover:underline">
            ← Quay lại danh sách race
          </button>
        </div>
      </RefereeLayout>
    );
  }

  return (
    <RefereeLayout
      title={`Race · ${race.name}`}
      subtitle={`${race.tournamentName} · R${race.no} · ${race.date} ${race.time}`}
      actions={
        <Link to="/referee/races">
          <GhostButton icon={ArrowLeft}>Trở về</GhostButton>
        </Link>
      }
    >
      {/* Hero context bar */}
      <GlassCard className="mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#0F1E3A] via-[#1E3A5F] to-[#0A1628] p-6 border-b border-white/10">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,#D4A017,transparent_60%)]" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4A017] to-[#B8941F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D4A017]/40">
                <span className="text-2xl font-bold text-white">R{race.no}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Pill tone={raceStatusTone(race.status)}>{race.status}</Pill>
                  <span className="text-[11px] text-white/40 font-mono">{race.id}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{race.name}</h2>
                <p className="text-sm text-[#D4A017]/80 mt-0.5">{race.tournamentName}</p>
              </div>
            </div>
            <Countdown target={`${race.date}T${race.time}:00`} />
          </div>
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <MetaTile icon={Calendar} label="Thời gian" value={`${race.date} · ${race.time}`} />
            <MetaTile icon={MapPin} label="Sân" value={race.track} />
            <MetaTile icon={Flag} label="Cự ly" value={`${race.distance} · ${race.surface}`} />
            <MetaTile icon={Users} label="Ngựa" value={`${race.checkedIn}/${race.totalHorses}`} />
            <MetaTile icon={Activity} label="Mặt sân" value="Tốt · Khô" />
          </div>
        </div>

        <div className="px-4 md:px-6 flex flex-wrap gap-1 border-b border-white/10">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`px-4 py-3 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 -mb-px ${
                  active
                    ? 'border-[#D4A017] text-[#D4A017]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {tab === 'overview' && <OverviewTab race={race} setTab={setTab} />}
      {tab === 'checkin' && <CheckInTab race={race} />}
      {tab === 'violations' && <ViolationsTab race={race} />}
      {tab === 'results' && <ResultsTab race={race} />}
      {tab === 'progression' && <ProgressionTab race={race} />}
    </RefereeLayout>
  );
}

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(target).getTime() - now;
  const past = diff <= 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl px-5 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Timer className="w-3.5 h-3.5 text-[#D4A017]" />
        <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
          {past ? 'Đã qua' : 'Còn lại'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-3xl font-bold text-[#D4A017]">{String(h).padStart(2, '0')}</span>
        <span className="text-white/40">:</span>
        <span className="text-3xl font-bold text-[#D4A017]">{String(m).padStart(2, '0')}</span>
        <span className="text-white/40">:</span>
        <span className="text-3xl font-bold text-[#D4A017]">{String(s).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

function MetaTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-[#D4A017]" />
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-sm font-bold text-white truncate">{value}</div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({ race, setTab }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <GlassCard>
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
            <h3 className="font-bold text-white">Trạng thái điều hành</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <StepCard
              n={1}
              title="Check-in ngựa"
              status={race.checkedIn === race.totalHorses ? 'done' : race.checkedIn > 0 ? 'active' : 'pending'}
              sub={`${race.checkedIn}/${race.totalHorses} đã check-in`}
              onClick={() => setTab('checkin')}
            />
            <StepCard
              n={2}
              title="Theo dõi vi phạm"
              status={race.status === 'Đang đua' ? 'active' : race.status === 'Đã kết thúc' ? 'done' : 'pending'}
              sub="Ghi nhận trong suốt cuộc đua"
              onClick={() => setTab('violations')}
            />
            <StepCard
              n={3}
              title="Nhập & xác nhận kết quả"
              status={race.status === 'Đã kết thúc' ? 'active' : 'pending'}
              sub="Kết quả chính thức"
              onClick={() => setTab('results')}
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Gavel className="w-5 h-5 text-[#D4A017]" />
            <h3 className="font-bold text-white">Luật race áp dụng</h3>
          </div>
          <div className="p-5 text-sm text-white/70 leading-relaxed space-y-2">
            <RuleItem text="Ngựa phải có giấy chứng nhận sức khỏe hợp lệ trong vòng 30 ngày." />
            <RuleItem text="Jockey phải có chứng chỉ FIA hoặc tương đương cấp độ Hạng A." />
            <RuleItem text="Check-in kết thúc 15 phút trước giờ xuất phát chính thức." />
            <RuleItem text="Mọi vi phạm phải được ghi nhận kèm bằng chứng (video/ảnh)." />
            <RuleItem text="Kiểm tra doping bắt buộc với ngựa thắng cuộc & 1 ngẫu nhiên." />
          </div>
        </GlassCard>
      </div>

      <div className="space-y-6">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-[#D4A017]" />
            <h3 className="text-sm font-bold text-white">Điều kiện thi đấu</h3>
          </div>
          <div className="space-y-2 text-xs">
            <Row k="Nhiệt độ" v="28°C" />
            <Row k="Độ ẩm" v="62%" />
            <Row k="Gió" v="8 km/h · Đông Nam" />
            <Row k="Mặt sân" v="Cỏ tốt" />
            <Row k="Tầm nhìn" v="Tốt" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 bg-gradient-to-br from-[#D4A017]/10 to-transparent border-[#D4A017]/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <h3 className="text-sm font-bold text-white">Đội hỗ trợ</h3>
          </div>
          <div className="space-y-2 text-xs">
            <Person name="Lê Trọng Tài" role="Trọng tài chính" />
            <Person name="Phạm Minh Quân" role="Trợ lý trọng tài" />
            <Person name="BS Hoàng Nam" role="Bác sĩ thú y" />
            <Person name="Nguyễn Mai" role="Y tế jockey" />
            <Person name="Trần Cường" role="Vận hành cổng" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StepCard({ n, title, status, sub, onClick }) {
  const map = {
    done: { bg: 'bg-emerald-500/15 border-emerald-500/40', icon: CheckCircle2, color: 'text-emerald-300' },
    active: { bg: 'bg-[#D4A017]/15 border-[#D4A017]/40', icon: Activity, color: 'text-[#D4A017]' },
    pending: { bg: 'bg-white/[0.04] border-white/10', icon: Lock, color: 'text-white/40' },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all hover:border-[#D4A017]/40 ${m.bg}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center font-bold ${m.color}`}>
          {n}
        </div>
        <Icon className={`w-4 h-4 ${m.color}`} />
      </div>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>
    </button>
  );
}

function RuleItem({ text }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/50">{k}</span>
      <span className="text-white font-semibold text-right">{v}</span>
    </div>
  );
}

function Person({ name, role }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/[0.04] rounded-lg">
      <div className="w-7 h-7 bg-gradient-to-br from-[#D4A017] to-[#B8941F] rounded-md flex items-center justify-center text-xs font-bold">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-white truncate">{name}</div>
        <div className="text-[10px] text-white/40 truncate">{role}</div>
      </div>
    </div>
  );
}

/* ---------------- Check-in ---------------- */
function CheckInTab({ race }) {
  const [horses, setHorses] = useState(() => buildHorses(race));
  const [filter, setFilter] = useState('all');
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState('');

  const setStatus = (id, status) => {
    setHorses((hs) => hs.map((h) => (h.id === id ? { ...h, checkIn: status } : h)));
  };
  const setNote = (id, text) => {
    setHorses((hs) => hs.map((h) => (h.id === id ? { ...h, note: text } : h)));
  };

  const filtered = horses.filter((h) => filter === 'all' || h.checkIn === filter);
  const counts = {
    'Đã check-in': horses.filter((h) => h.checkIn === 'Đã check-in').length,
    Chờ: horses.filter((h) => h.checkIn === 'Chờ').length,
    'Vắng mặt': horses.filter((h) => h.checkIn === 'Vắng mặt').length,
    'Không đủ điều kiện': horses.filter((h) => h.checkIn === 'Không đủ điều kiện').length,
    'Vi phạm': horses.filter((h) => h.checkIn === 'Vi phạm').length,
  };
  const pct = Math.round((counts['Đã check-in'] / horses.length) * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <CountTile label="Đã check-in" v={counts['Đã check-in']} total={horses.length} tone="green" icon={CheckCircle2} />
        <CountTile label="Chờ" v={counts['Chờ']} total={horses.length} tone="gold" icon={Clock} />
        <CountTile label="Vắng mặt" v={counts['Vắng mặt']} total={horses.length} tone="gray" icon={Ban} />
        <CountTile label="Không đủ ĐK" v={counts['Không đủ điều kiện']} total={horses.length} tone="purple" icon={AlertOctagon} />
        <CountTile label="Vi phạm" v={counts['Vi phạm']} total={horses.length} tone="red" icon={AlertTriangle} />
      </div>

      <GlassCard>
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A017]/15 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Bảng check-in · {race.name}</h3>
              <p className="text-xs text-white/50">{counts['Đã check-in']}/{horses.length} ngựa đã check-in · {pct}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="Đã check-in">Đã check-in</option>
              <option value="Chờ">Chờ</option>
              <option value="Vắng mặt">Vắng mặt</option>
              <option value="Không đủ điều kiện">Không đủ điều kiện</option>
              <option value="Vi phạm">Vi phạm</option>
            </Select>
            <GhostButton icon={Upload}>Xuất danh sách</GhostButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
                <th className="px-4 py-3 text-center w-14">#</th>
                <th className="px-4 py-3">Ngựa</th>
                <th className="px-4 py-3">Chủ ngựa</th>
                <th className="px-4 py-3">Jockey</th>
                <th className="px-4 py-3 text-center">Sức khỏe</th>
                <th className="px-4 py-3 text-center">Cọc</th>
                <th className="px-4 py-3 text-center">Check-in</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex w-8 h-8 rounded-lg bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 items-center justify-center font-bold text-sm">
                      {h.no}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white text-sm">{h.horse}</div>
                    {h.note && <div className="text-[10px] text-[#D4A017] mt-0.5 italic line-clamp-1">"{h.note}"</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{h.owner}</td>
                  <td className="px-4 py-3 text-sm text-white/70">{h.jockey}</td>
                  <td className="px-4 py-3 text-center">
                    <Pill tone={h.health === 'Hợp lệ' ? 'green' : 'red'}>{h.health}</Pill>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Pill tone={h.deposit === 'Đã thanh toán' ? 'green' : 'red'}>{h.deposit}</Pill>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Pill tone={checkinTone(h.checkIn)}>{h.checkIn}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ActionBtn
                        tone="green"
                        icon={CheckCircle2}
                        active={h.checkIn === 'Đã check-in'}
                        title="Có mặt"
                        onClick={() => setStatus(h.id, 'Đã check-in')}
                      />
                      <ActionBtn
                        tone="gray"
                        icon={Ban}
                        active={h.checkIn === 'Vắng mặt'}
                        title="Vắng mặt"
                        onClick={() => setStatus(h.id, 'Vắng mặt')}
                      />
                      <ActionBtn
                        tone="purple"
                        icon={AlertOctagon}
                        active={h.checkIn === 'Không đủ điều kiện'}
                        title="Không đủ ĐK"
                        onClick={() => setStatus(h.id, 'Không đủ điều kiện')}
                      />
                      <ActionBtn
                        tone="red"
                        icon={AlertTriangle}
                        active={h.checkIn === 'Vi phạm'}
                        title="Vi phạm"
                        onClick={() => setStatus(h.id, 'Vi phạm')}
                      />
                      <button
                        onClick={() => { setNoteFor(h.id); setNoteText(h.note ?? ''); }}
                        className="p-2 text-white/60 hover:text-[#D4A017] hover:bg-[#D4A017]/10 rounded-lg"
                        title="Ghi chú"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {noteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setNoteFor(null)}>
          <div className="bg-[#0F1E3A] border border-white/10 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#D4A017]" />
              <h3 className="font-bold text-white">Ghi chú trọng tài</h3>
            </div>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ghi chú nội bộ về ngựa này..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4A017] resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton onClick={() => setNoteFor(null)}>Hủy</GhostButton>
              <PrimaryButton
                icon={Save}
                onClick={() => {
                  setNote(noteFor, noteText);
                  setNoteFor(null);
                }}
              >
                Lưu
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CountTile({ label, v, total, tone, icon: Icon }) {
  const map = {
    green: 'from-emerald-500/25 to-emerald-500/5 text-emerald-300',
    gold: 'from-[#D4A017]/25 to-[#D4A017]/5 text-[#D4A017]',
    gray: 'from-white/15 to-white/5 text-white/60',
    purple: 'from-purple-500/25 to-purple-500/5 text-purple-300',
    red: 'from-red-500/25 to-red-500/5 text-red-300',
  };
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${map[tone]} border border-white/10 flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-white/40 font-mono">/{total}</span>
      </div>
      <div className="text-2xl font-bold text-white">{v}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </GlassCard>
  );
}

function ActionBtn({ tone, icon: Icon, active, title, onClick }) {
  const map = {
    green: active ? 'bg-emerald-500 text-white' : 'text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10',
    gray: active ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10',
    purple: active ? 'bg-purple-500 text-white' : 'text-purple-300/70 hover:text-purple-300 hover:bg-purple-500/10',
    red: active ? 'bg-red-500 text-white' : 'text-red-300/70 hover:text-red-300 hover:bg-red-500/10',
  };
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded-lg transition-all ${map[tone]}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

/* ---------------- Violations ---------------- */
function ViolationsTab({ race }) {
  const horses = useMemo(() => buildHorses(race), [race]);
  const list = allViolations.filter((v) => v.raceId === race.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    horseNo: 1,
    type: 'Lái nguy hiểm',
    severity: 'Phạt nhẹ',
    description: '',
    penalty: '',
    evidence: '',
  });
  const [, force] = useState(0);

  const submit = () => {
    const h = horses.find((x) => x.no === Number(form.horseNo));
    if (!h) return;
    const v = {
      id: `V-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      raceId: race.id,
      raceName: race.name,
      horseNo: h.no,
      horse: h.horse,
      jockey: h.jockey,
      type: form.type,
      severity: form.severity,
      description: form.description || '(không có mô tả)',
      penalty: form.penalty || 'Cảnh cáo',
      evidence: form.evidence ? [{ name: form.evidence, size: '—' }] : [],
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      reporter: 'Lê Trọng Tài',
    };
    addViolation(v);
    setOpen(false);
    setForm({ ...form, description: '', penalty: '', evidence: '' });
    force((x) => x + 1);
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <h3 className="font-bold text-white">Vi phạm trong race · {race.name}</h3>
              <p className="text-xs text-white/50">{list.length} vi phạm đã ghi nhận</p>
            </div>
          </div>
          <PrimaryButton icon={Plus} onClick={() => setOpen(true)}>
            Ghi nhận vi phạm
          </PrimaryButton>
        </div>

        <div className="p-5 space-y-3">
          {list.length === 0 && (
            <div className="text-center py-12 text-white/40 text-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Chưa có vi phạm nào được ghi nhận trong race này.
            </div>
          )}
          {list.map((v) => (
            <div key={v.id} className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-center font-bold text-red-300">
                    #{v.horseNo}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{v.horse} <span className="text-white/40 text-xs">· {v.jockey}</span></div>
                    <div className="text-[11px] text-[#D4A017] font-mono">{v.id} · {v.timestamp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="red">{v.type}</Pill>
                  <Pill tone={severityTone(v.severity)}>{v.severity}</Pill>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-3">{v.description}</p>
              <div className="p-3 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl mb-3">
                <div className="text-[10px] text-[#D4A017] uppercase tracking-wider font-bold mb-1">Hình phạt</div>
                <div className="text-sm text-white">{v.penalty}</div>
              </div>
              {v.evidence.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {v.evidence.map((f) => (
                    <div key={f.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs">
                      <Camera className="w-3.5 h-3.5 text-[#D4A017]" />
                      <span className="text-white">{f.name}</span>
                      <span className="text-white/40">· {f.size}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-[10px] text-white/40 flex items-center gap-1.5">
                <Gavel className="w-3 h-3" /> Ghi bởi {v.reporter}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-[#0F1E3A] border border-white/10 rounded-2xl max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-br from-red-500/20 to-transparent">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-300" />
                <div>
                  <h3 className="font-bold text-white">Ghi nhận vi phạm mới</h3>
                  <p className="text-xs text-white/50">Tất cả vi phạm phải có bằng chứng đính kèm</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ngựa vi phạm *">
                <Select value={String(form.horseNo)} onChange={(e) => setForm({ ...form, horseNo: Number(e.target.value) })} className="w-full">
                  {horses.map((h) => (
                    <option key={h.id} value={h.no}>#{h.no} · {h.horse} · {h.jockey}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Loại vi phạm *">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
                  <option>Xuất phát sai</option>
                  <option>Lái nguy hiểm</option>
                  <option>Vi phạm trang bị</option>
                  <option>Nghi doping</option>
                  <option>Check-in muộn</option>
                  <option>Khác</option>
                </Select>
              </Field>
              <Field label="Mức độ *">
                <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full">
                  <option>Cảnh cáo</option>
                  <option>Phạt nhẹ</option>
                  <option>Phạt nặng</option>
                  <option>Loại</option>
                </Select>
              </Field>
              <Field label="Thời điểm">
                <TextInput value={new Date().toISOString().slice(0, 16).replace('T', ' ')} disabled />
              </Field>
              <div className="md:col-span-2">
                <Field label="Mô tả chi tiết *">
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả hành vi vi phạm, thời điểm xảy ra, vị trí trên đường đua..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#D4A017] resize-none"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Hình phạt áp dụng">
                  <TextInput
                    value={form.penalty}
                    onChange={(e) => setForm({ ...form, penalty: e.target.value })}
                    placeholder="VD: Trừ 3 giây thành tích · Loại khỏi race · Cấm 3 tháng..."
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Bằng chứng (video/ảnh)">
                  <div className="border-2 border-dashed border-[#D4A017]/40 bg-[#D4A017]/5 rounded-xl p-6 text-center cursor-pointer hover:bg-[#D4A017]/10 transition-all">
                    <Upload className="w-6 h-6 text-[#D4A017] mx-auto mb-2" />
                    <div className="text-sm text-white font-semibold">Kéo thả hoặc bấm để tải lên</div>
                    <div className="text-[11px] text-white/50 mt-1">MP4, MOV, JPG, PNG · tối đa 100MB</div>
                  </div>
                  <TextInput
                    className="mt-2"
                    value={form.evidence}
                    onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                    placeholder="Hoặc nhập tên file (demo): turn2-replay.mp4"
                  />
                </Field>
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-2 border-t border-white/10 pt-4">
              <GhostButton onClick={() => setOpen(false)}>Hủy</GhostButton>
              <PrimaryButton icon={Send} onClick={submit} disabled={!form.description.trim()}>
                Ghi nhận vi phạm
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">{label}</label>
      {children}
    </div>
  );
}

/* ---------------- Results ---------------- */

function ResultsTab({ race }) {
  const horses = useMemo(() => buildHorses(race), [race]);
  const [confirmed, setConfirmed] = useState(race.status === 'Đã kết thúc');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState(() =>
    horses.map((h, i) => ({
      no: h.no,
      horse: h.horse,
      jockey: h.jockey,
      position: i + 1,
      time: `01:${(23 + i * 0.18).toFixed(2).padStart(5, '0')}`,
      penalty: '',
      dq: false,
    }))
  );

  const setPos = (no, p) => setRows((r) => r.map((x) => (x.no === no ? { ...x, position: p } : x)));
  const setTime = (no, t) => setRows((r) => r.map((x) => (x.no === no ? { ...x, time: t } : x)));
  const setPenalty = (no, p) => setRows((r) => r.map((x) => (x.no === no ? { ...x, penalty: p } : x)));
  const toggleDq = (no) => setRows((r) => r.map((x) => (x.no === no ? { ...x, dq: !x.dq } : x)));

  const sortByPos = () =>
    setRows((rs) => {
      const sorted = [...rs].sort((a, b) => {
        if (a.dq && !b.dq) return 1;
        if (!a.dq && b.dq) return -1;
        return a.position - b.position;
      });
      return sorted.map((x, i) => ({ ...x, position: x.dq ? rs.length : i + 1 }));
    });

  const winner = rows.find((x) => x.position === 1 && !x.dq);

  if (confirmed) {
    return (
      <GlassCard>
        <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-transparent border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kết quả chính thức đã được xác nhận</h3>
              <p className="text-xs text-white/60">
                Ký bởi Lê Trọng Tài · Phát hành cho tournament và người dùng
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[1, 2, 3].map((p) => {
              const r = rows.find((x) => x.position === p && !x.dq);
              if (!r) return null;
              const Icon = p === 1 ? Crown : Medal;
              const tone = p === 1 ? 'gold' : p === 2 ? 'gray' : 'purple';
              const bg = p === 1 ? 'from-[#D4A017]/20' : p === 2 ? 'from-white/10' : 'from-orange-500/15';
              return (
                <div key={p} className={`p-4 bg-gradient-to-br ${bg} to-transparent border border-white/10 rounded-2xl`}>
                  <Icon className={`w-5 h-5 mb-2 ${p === 1 ? 'text-[#D4A017]' : p === 2 ? 'text-white/60' : 'text-orange-300'}`} />
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Hạng {p}</div>
                  <div className="text-lg font-bold text-white mt-1">{r.horse}</div>
                  <div className="text-xs text-white/60">{r.jockey} · {r.time}</div>
                  <Pill tone={tone}>#{r.no}</Pill>
                </div>
              );
            })}
          </div>
          <ResultsTable rows={rows} readOnly />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      <GlassCard className="p-4 flex items-start gap-3 bg-gradient-to-r from-[#D4A017]/10 to-transparent border-[#D4A017]/30">
        <Info className="w-5 h-5 text-[#D4A017] mt-0.5 shrink-0" />
        <div className="text-xs text-white/70 leading-relaxed">
          Nhập thứ hạng & thời gian từng ngựa, đánh dấu DQ cho ngựa bị loại, kèm hình phạt nếu có. Khi xác nhận, kết quả sẽ
          được <span className="text-[#D4A017] font-semibold">khóa và phát hành chính thức</span> tới hệ thống tournament và người chơi.
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A017]/15 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Nhập kết quả · {race.name}</h3>
              <p className="text-xs text-white/50">{rows.length} ngựa · {winner ? `Vô địch dự kiến: ${winner.horse}` : 'Chưa có vô địch'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton icon={Activity} onClick={sortByPos}>Sắp xếp theo hạng</GhostButton>
            <GhostButton icon={Save}>Lưu nháp</GhostButton>
          </div>
        </div>
        <div className="p-5">
          <ResultsTable
            rows={rows}
            onPos={setPos}
            onTime={setTime}
            onPenalty={setPenalty}
            onDq={toggleDq}
          />
          <div className="mt-5">
            <label className="block text-xs uppercase tracking-wider text-white/60 font-semibold mb-2">Ghi chú race</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tóm tắt diễn biến race, điều kiện sân, sự cố đặc biệt..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4A017] resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-[#D4A017]/5 to-transparent">
          <div className="text-xs text-white/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Sau khi xác nhận, kết quả không thể chỉnh sửa · cần admin mở khóa nếu có khiếu nại
          </div>
          <PrimaryButton icon={Send} onClick={() => setConfirmed(true)}>
            Xác nhận & phát hành kết quả
          </PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );
}

function ResultsTable({ rows, onPos, onTime, onPenalty, onDq, readOnly }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
            <th className="px-3 py-3 w-20 text-center">Hạng</th>
            <th className="px-3 py-3 w-14 text-center">#</th>
            <th className="px-3 py-3">Ngựa & Jockey</th>
            <th className="px-3 py-3 w-32">Thời gian</th>
            <th className="px-3 py-3 w-48">Hình phạt</th>
            <th className="px-3 py-3 w-24 text-center">DQ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const podium = !r.dq && r.position <= 3;
            const icon = r.position === 1 ? Crown : Medal;
            const PI = icon;
            return (
              <tr key={r.no} className={`border-b border-white/5 ${r.dq ? 'opacity-50' : ''}`}>
                <td className="px-3 py-3 text-center">
                  {readOnly ? (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${
                      r.dq ? 'bg-red-500/15 text-red-300' :
                      r.position === 1 ? 'bg-[#D4A017] text-white' :
                      r.position === 2 ? 'bg-white/20 text-white' :
                      r.position === 3 ? 'bg-orange-500/30 text-orange-200' :
                      'bg-white/10 text-white/70'
                    }`}>
                      {podium && <PI className="w-3.5 h-3.5" />}
                      {r.dq ? 'DQ' : r.position}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={rows.length}
                      value={r.position}
                      onChange={(e) => onPos?.(r.no, Number(e.target.value))}
                      className="w-14 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-bold text-center focus:outline-none focus:border-[#D4A017]"
                    />
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex w-8 h-8 rounded-lg bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 items-center justify-center font-bold text-xs">
                    {r.no}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-semibold text-white">{r.horse}</div>
                  <div className="text-[11px] text-white/50">{r.jockey}</div>
                </td>
                <td className="px-3 py-3">
                  {readOnly ? (
                    <span className="font-mono text-sm text-white">{r.dq ? '—' : r.time}</span>
                  ) : (
                    <input
                      value={r.time}
                      onChange={(e) => onTime?.(r.no, e.target.value)}
                      className="w-28 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#D4A017]"
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  {readOnly ? (
                    <span className="text-xs text-white/60">{r.penalty || '—'}</span>
                  ) : (
                    <input
                      value={r.penalty}
                      onChange={(e) => onPenalty?.(r.no, e.target.value)}
                      placeholder="VD: -2s · Cảnh cáo"
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#D4A017]"
                    />
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {readOnly ? (
                    r.dq ? <Pill tone="red">DQ</Pill> : <span className="text-white/30">—</span>
                  ) : (
                    <button
                      onClick={() => onDq?.(r.no)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        r.dq ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-300'
                      }`}
                    >
                      DQ
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Progression ---------------- */
function ProgressionTab({ race }) {
  const advancing = ['Thunder Bolt', 'Black Pearl', 'Wind Runner', 'Golden Star'];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-2">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4A017]/15 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#D4A017]" />
          </div>
          <div>
            <h3 className="font-bold text-white">Cập nhật tự động sau khi xác nhận kết quả</h3>
            <p className="text-xs text-white/50">Hệ thống xử lý các bước sau khi trọng tài ký kết quả</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {[
            { icon: CheckCircle2, t: 'Bảng xếp hạng giải đấu cập nhật', d: 'Tổng điểm và win-rate được tính lại cho toàn bộ ngựa.' },
            { icon: ArrowRight, t: 'Top 4 thăng tiến vào vòng tiếp theo', d: 'Vô địch và 3 á quân tự động đăng ký vào Bán kết.' },
            { icon: Award, t: 'Phát hành giải thưởng', d: 'Tiền thưởng được lock trong escrow, sẵn sàng chi trả.' },
            { icon: Send, t: 'Thông báo tới tất cả người dùng', d: 'Chủ ngựa, jockey, khán giả và admin nhận push notification.' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{s.t}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#D4A017]" />
          <h3 className="font-bold text-white">Top 4 thăng vòng</h3>
        </div>
        <div className="p-5 space-y-2">
          {advancing.map((h, i) => (
            <div key={h} className="p-3 bg-gradient-to-r from-[#D4A017]/10 to-transparent border border-[#D4A017]/30 rounded-xl flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                i === 0 ? 'bg-[#D4A017] text-white' : 'bg-white/10 text-[#D4A017] border border-[#D4A017]/30'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{h}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">→ Bán kết</div>
              </div>
              {i === 0 && <Crown className="w-4 h-4 text-[#D4A017]" />}
            </div>
          ))}
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 mx-auto mb-1" />
            <div className="text-xs text-emerald-300 font-semibold">Đủ điều kiện thăng vòng</div>
            <div className="text-[10px] text-white/60 mt-0.5">Vòng tiếp theo: Bán kết · 2026-05-26</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
