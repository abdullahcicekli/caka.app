import { PillLink } from "./pill-button";
import type { LandingContent } from "~/content/landing";

const BAR_HEIGHTS = ["30%", "52%", "40%", "66%", "54%", "78%", "62%", "88%"];

function BarChart() {
  return (
    <div className="flex h-[76px] items-end gap-[5px]">
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className="w-[10px] rounded-[3px] bg-kirec"
          style={{ height }}
        />
      ))}
    </div>
  );
}

/** Kum renk bloğu: solda analitik kartları, sağda başlık + CTA. */
export function AudienceSection({
  audience,
}: {
  audience: LandingContent["audience"];
}) {
  return (
    <section className="bg-kum">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
          <div className="col-span-2 flex items-center justify-between rounded-2xl bg-selvi p-6">
            <BarChart />
            <div className="text-right">
              <div className="text-4xl font-bold tracking-tight text-kirec">
                {audience.metrics[0].value}
              </div>
              <div className="mt-0.5 text-sm font-semibold text-selvi-acik">
                {audience.metrics[0].label}
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-erik-acik p-6">
            <div className="text-[34px] leading-none font-bold tracking-tight text-erik">
              {audience.metrics[1].value}
            </div>
            <div className="mt-2 text-sm font-semibold text-erik">
              {audience.metrics[1].label}
            </div>
          </div>
          <div className="rounded-2xl bg-mavi p-6">
            <div className="text-[34px] leading-none font-bold tracking-tight text-white">
              {audience.metrics[2].value}
            </div>
            <div className="mt-2 text-sm font-semibold text-zemin/90">
              {audience.metrics[2].label}
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-5xl leading-[1.02] font-bold tracking-tight whitespace-pre-line text-murekkep sm:text-6xl">
            {audience.title}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-murekkep/70 sm:text-xl">
            {audience.body}
          </p>
          <PillLink to={audience.cta.href} variant="ink" className="mt-9">
            {audience.cta.label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}