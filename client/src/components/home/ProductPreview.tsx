const REVENUE = [42, 46, 44, 51, 57, 63, 60, 72];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function revenuePoints() {
  const plotLeft = 18;
  const plotRight = 302;
  const height = 132;
  const min = 36;
  const max = 78;
  return REVENUE.map((value, index) => {
    const x = plotLeft + (index / (REVENUE.length - 1)) * (plotRight - plotLeft);
    const y = height - ((value - min) / (max - min)) * (height - 8) - 4;
    return { x, y };
  });
}

function RevenueChart() {
  const points = revenuePoints();
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `18,132 ${line} 302,132`;
  const last = points[points.length - 1];

  const gridLines = [36, 68, 100];

  return (
    <svg viewBox="0 0 320 156" className="h-40 w-full" role="img" aria-label="Illustrated monthly recurring revenue, rising from January to August">
      {gridLines.map((y) => (
        <line key={y} x1="18" y1={y} x2="302" y2={y} stroke="#D6E0E2" strokeWidth="1" />
      ))}
      <line x1="18" y1="132" x2="302" y2="132" stroke="#D6E0E2" strokeWidth="1" />
      <polygon points={area} fill="#5E6C5B" opacity="0.12" />
      <polyline points={line} fill="none" stroke="#5E6C5B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="4.5" fill="#162A3C" />
      {MONTHS.map((month, index) => (
        <text
          key={month}
          x={points[index].x}
          y="152"
          textAnchor="middle"
          fill="#686867"
          fontSize="10"
          fontFamily="Manrope, Inter, sans-serif"
        >
          {month}
        </text>
      ))}
    </svg>
  );
}

function ChartCard() {
  return (
    <article className="rounded-xl border border-sky bg-white p-5 shadow-card sm:p-6 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:z-10 lg:mt-12 lg:pr-16">
      <div className="mb-4">
        <p className="text-caption font-medium uppercase tracking-[0.08em] text-storm">Monthly recurring revenue</p>
        <div className="mt-1 flex items-baseline gap-3">
          <p className="text-heading font-semibold text-navy">$72.4k</p>
          <p className="text-caption font-medium text-forest">+18% qtr</p>
        </div>
      </div>
      <RevenueChart />
    </article>
  );
}

function VizardCard() {
  return (
    <article className="rounded-xl border border-sky bg-white p-5 shadow-lift sm:p-6 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:z-20">
      <p className="text-caption font-medium uppercase tracking-[0.08em] text-forest">Data Vizard</p>
      <h3 className="mt-2 text-heading font-semibold text-navy">What changed</h3>
      <p className="mt-3 text-base font-medium leading-relaxed text-navy">
        August closed at the high for this range. Revenue eased in July, then climbed back without a sharp spike.
      </p>
      <dl className="mt-5 space-y-3 border-t border-sky pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-storm">Strongest month</dt>
          <dd className="text-sm font-medium text-navy">August, $72.4k</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-storm">Weakest month</dt>
          <dd className="text-sm font-medium text-navy">January, $42.0k</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-caption text-storm">Sharpest dip</dt>
          <dd className="text-sm font-medium text-navy">July, $60.0k</dd>
        </div>
      </dl>
    </article>
  );
}

function KpiCard() {
  return (
    <article className="rounded-xl border border-sky bg-white px-5 py-4 shadow-card lg:z-30 lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:-mt-6 lg:ml-8 lg:w-[240px]">
      <p className="text-caption font-medium uppercase tracking-[0.08em] text-storm">Net revenue retention</p>
      <p className="mt-1 text-heading font-semibold text-navy">118%</p>
      <p className="mt-1 text-caption text-slateblue">Existing customers expanded</p>
    </article>
  );
}

export function ProductPreview() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-6 bottom-6 hidden rounded-2xl border border-sky bg-cream lg:block" />
      <div className="relative grid gap-4 lg:grid-cols-12">
        <ChartCard />
        <VizardCard />
        <KpiCard />
      </div>
    </div>
  );
}
