export default function Field({ label, icon: Icon, full = false, children }) {
  return (
    <label className={`${full ? "md:col-span-2" : ""} block`}>
      {label && (
        <span className="mb-2 block text-sm font-semibold text-white/70">
          {Icon && (
            <Icon className="mr-2 inline-block h-4 w-4 text-[#dda50e]" />
          )}
          {label}
        </span>
      )}
      {children}
    </label>
  );
}
