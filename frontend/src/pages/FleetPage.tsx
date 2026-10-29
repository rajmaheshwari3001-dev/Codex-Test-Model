import FleetDashboard from '../components/FleetDashboard'

export default function FleetPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-[2rem] bg-[#172421] px-6 py-6 text-[#f4f1e7] sm:flex-row sm:items-end sm:px-8 sm:py-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c0ce9b]">
            Aaroh-Saarthi / Operations / 02
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            The fleet desk
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c7d0c5]">
            Monitor the sample vehicle roster and evaluate simulated disruption responses.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#6f8851]/50 bg-[#293a35] px-3 py-2 text-xs font-semibold text-[#d9ed55]">
          <span className="h-2 w-2 rounded-full bg-[#d9ed55]" aria-hidden="true" />
          Simulation active
        </div>
      </section>
      <FleetDashboard />
    </div>
  )
}
