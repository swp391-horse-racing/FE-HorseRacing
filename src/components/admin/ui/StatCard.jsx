export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "gold",
}) {
  const tones = {
    gold: "border-[#dda50e]/25 bg-[#dda50e]/15 text-[#dda50e]",
    blue: "border-sky-400/25 bg-sky-400/15 text-sky-300",
    green: "border-emerald-400/25 bg-emerald-400/15 text-emerald-300",
    purple: "border-purple-400/25 bg-purple-400/15 text-purple-300",
  };
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-7">
      <div className="mb-7 flex items-start justify-between">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${tones[tone]}`}
        >
          <Icon className="h-8 w-8" />
        </span>
        <span className="rounded-2xl bg-emerald-500/15 px-4 py-2 font-bold text-emerald-300">
          {delta}
        </span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="mt-2 text-base text-white/50">{label}</p>
    </div>
  );
}
