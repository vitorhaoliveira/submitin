/** Logo + nome da empresa no topo do formulário público. */
export function BrandHeader({ name, logoUrl }: { name: string | null; logoUrl: string | null }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name ?? ""} className="h-10 w-auto max-w-[9rem] shrink-0 object-contain" />
      )}
      {name && <span className="text-base font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{name}</span>}
    </div>
  );
}
