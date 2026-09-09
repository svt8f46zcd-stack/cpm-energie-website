type BillRecipientProps = {
  firstName?: { value: string | null };
  lastName?: { value: string | null };
};

export function BillRecipient({ firstName, lastName }: BillRecipientProps) {
  const complete = Boolean(firstName?.value && lastName?.value);
  const name = complete ? [firstName?.value, lastName?.value].filter(Boolean).join(" ") : "Nicht sicher erkannt";

  return (
    <div className="border-t border-white/10 bg-white/[.02] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-500">Rechnungsempfänger</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{name}</p>
    </div>
  );
}
