export function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-1 text-white/50">{subtitle}</p>
    </div>
  );
}
export function PanelHeader({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-2xl font-bold">{title}</h3>
      {action}
    </div>
  );
}
export function PanelActions({ children }) {
  return <div className="flex gap-3">{children}</div>;
}
export function Meta({ children }) {
  return <span className="text-sm text-white/55">{children}</span>;
}
export function SimpleTable({ children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
      {children}
    </div>
  );
}
export function BarSummary({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      {label}: <strong>{value}</strong>
    </div>
  );
}
