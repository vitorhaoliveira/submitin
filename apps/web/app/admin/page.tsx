import Link from "next/link";
import { prisma, Prisma } from "@submitin/database";
import { PLANS, intervalFromPriceId, normalizePlan, yearlyMonthlyEquivalent } from "@/lib/stripe";
import { startOfMonth } from "@/lib/documents/service";
import { formatRelativeShort } from "@/lib/utils";

const PAGE_SIZE = 50;
const DAY = 86_400_000;

type SearchParams = { q?: string; page?: string };

type GenRow = { userId: string; month: bigint; total: bigint };

function pct(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** /admin — quem usa o Submitin: cadastros, planos, ativação e uso. */
export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q = "", page: pageParam } = await searchParams;
  const search = q.trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const now = Date.now();
  const monthStart = startOfMonth();

  const where: Prisma.UserWhereInput = search
    ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
    : {};

  const [
    totalUsers,
    new7,
    new30,
    byPlan,
    paidUsers,
    pdfsThisMonth,
    totalDocuments,
    withDocument,
    withPublished,
    genByUser,
    signups,
    filteredCount,
    users,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(now - 7 * DAY) } } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(now - 30 * DAY) } } }),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.user.findMany({ where: { plan: { not: "free" } }, select: { plan: true, stripePriceId: true } }),
    prisma.documentGeneration.count({ where: { status: "concluida", completedAt: { gte: monthStart } } }),
    prisma.document.count(),
    prisma.user.count({ where: { documents: { some: {} } } }),
    prisma.user.count({ where: { documents: { some: { form: { published: true } } } } }),
    prisma.$queryRaw<GenRow[]>`
      select d."userId" as "userId",
             count(*) filter (where g."completedAt" >= ${monthStart}) as month,
             count(*) as total
      from document_generations g
      join documents d on d.id = g."documentId"
      where g.status = 'concluida'
      group by d."userId"`,
    prisma.$queryRaw<{ week: Date; count: bigint }[]>`
      select date_trunc('week', "createdAt") as week, count(*) as count
      from users
      where "createdAt" >= ${new Date(now - 8 * 7 * DAY)}
      group by 1 order by 1`,
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripePriceId: true,
        stripeCustomerId: true,
        createdAt: true,
        lastSeenAt: true,
        brandName: true,
        brandLogoKey: true,
        _count: { select: { documents: true, forms: true } },
        documents: { select: { form: { select: { published: true } } } },
      },
    }),
  ]);

  const gen = new Map(genByUser.map((r) => [r.userId, { month: Number(r.month), total: Number(r.total) }]));
  const withPdf = genByUser.length;
  const mrr = paidUsers.reduce((sum, u) => {
    const plan = normalizePlan(u.plan);
    return sum + (intervalFromPriceId(u.stripePriceId) === "year" ? yearlyMonthlyEquivalent(plan) : PLANS[plan].price);
  }, 0);
  const planCounts = Object.fromEntries(byPlan.map((p) => [p.plan, p._count._all]));
  const maxWeek = Math.max(1, ...signups.map((s) => Number(s.count)));
  const pages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const kpis = [
    { label: "Contas", value: totalUsers.toLocaleString("pt-BR"), hint: `+${new7} em 7 dias · +${new30} em 30 dias` },
    { label: "Pagantes", value: paidUsers.length.toLocaleString("pt-BR"), hint: `${pct(paidUsers.length, totalUsers)} das contas` },
    { label: "Receita mensal (estimada)", value: brl(mrr), hint: "Pelos preços da tabela; anual ÷ 12" },
    { label: "PDFs no mês", value: pdfsThisMonth.toLocaleString("pt-BR"), hint: `${totalDocuments} documentos criados` },
  ];

  const funnel = [
    { label: "Criaram conta", value: totalUsers },
    { label: "Criaram documento", value: withDocument },
    { label: "Publicaram o link", value: withPublished },
    { label: "Geraram o 1º PDF", value: withPdf },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Visão geral</h1>

      <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-background p-5">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-background p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Ativação</h2>
          <p className="text-xs text-muted-foreground">Quantas contas chegaram a cada passo</p>
          <ol className="mt-4 space-y-3">
            {funnel.map((f) => (
              <li key={f.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{f.label}</span>
                  <span className="tabular-nums">
                    <strong>{f.value}</strong>{" "}
                    <span className="text-muted-foreground">{pct(f.value, totalUsers)}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: pct(f.value, totalUsers) }} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-5 rounded-xl border bg-background p-5">
          <div>
            <h2 className="text-sm font-semibold">Planos</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {Object.keys(PLANS).map((key) => (
                <li key={key} className="flex justify-between">
                  <span>
                    {PLANS[key as keyof typeof PLANS].name}
                    {PLANS[key as keyof typeof PLANS].legacy && <span className="text-muted-foreground"> (legado)</span>}
                  </span>
                  <span className="tabular-nums font-medium">{planCounts[key] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Cadastros por semana</h2>
            <div className="mt-3 flex h-24 items-end gap-1.5" aria-label="Cadastros nas últimas 8 semanas">
              {signups.length === 0 && <p className="text-xs text-muted-foreground">Sem cadastros recentes.</p>}
              {signups.map((s) => (
                <div key={s.week.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-muted-foreground">{Number(s.count)}</span>
                  <div
                    className="w-full rounded-t bg-brand/80"
                    style={{ height: `${(Number(s.count) / maxWeek) * 64}px` }}
                    title={`Semana de ${s.week.toLocaleDateString("pt-BR")}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Contas <span className="text-sm font-normal text-muted-foreground">({filteredCount})</span>
          </h2>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar por e-mail ou nome"
              className="h-9 w-64 max-w-full rounded-md border bg-background px-3 text-sm"
            />
            <button className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted">Buscar</button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-background">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Conta</th>
                <th className="px-4 py-2.5 font-medium">Cadastro</th>
                <th className="px-4 py-2.5 font-medium">Plano</th>
                <th className="px-4 py-2.5 text-right font-medium">Documentos</th>
                <th className="px-4 py-2.5 text-right font-medium">PDFs no mês</th>
                <th className="px-4 py-2.5 text-right font-medium">PDFs total</th>
                <th className="px-4 py-2.5 font-medium">Primeiros passos</th>
                <th className="px-4 py-2.5 font-medium">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const g = gen.get(u.id) ?? { month: 0, total: 0 };
                const steps = [
                  u._count.documents > 0,
                  Boolean(u.brandName || u.brandLogoKey),
                  u.documents.some((d) => d.form.published),
                  g.total > 0,
                ];
                const done = steps.filter(Boolean).length;
                const plan = normalizePlan(u.plan);
                return (
                  <tr key={u.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.name || "—"}
                        {u.brandName ? ` · ${u.brandName}` : ""}
                        {u._count.forms > u._count.documents ? ` · ${u._count.forms - u._count.documents} formulários avulsos` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {u.createdAt.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={
                          plan === "free"
                            ? "text-muted-foreground"
                            : "rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand"
                        }
                      >
                        {PLANS[plan].name}
                        {plan !== "free" && intervalFromPriceId(u.stripePriceId) === "year" ? " anual" : ""}
                      </span>
                      {u.stripeCustomerId && (
                        <a
                          href={`https://dashboard.stripe.com/customers/${u.stripeCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-muted-foreground underline"
                        >
                          Stripe
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{u._count.documents}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{g.month}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{g.total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5" aria-label={`${done} de 4 passos`}>
                          {steps.map((ok, i) => (
                            <span key={i} className={`h-2 w-4 rounded-sm ${ok ? "bg-emerald-500" : "bg-muted"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{done}/4</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {u.lastSeenAt ? formatRelativeShort(u.lastSeenAt) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Página {page} de {pages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin?${new URLSearchParams({ q: search, page: String(page - 1) })}`} className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted">
                  Anterior
                </Link>
              )}
              {page < pages && (
                <Link href={`/admin?${new URLSearchParams({ q: search, page: String(page + 1) })}`} className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted">
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
