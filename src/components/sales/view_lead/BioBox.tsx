export default function BioBox({ remark, bioText }: { remark: any; bioText: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
      <h3 className="mb-3 text-sm font-semibold">Notes & Bio</h3>
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-1 text-xs font-medium text-gray-500">Latest remark</div>
          <div className="whitespace-pre-wrap text-base text-gray-800 dark:text-white/80">
            {remark?.trim() ? remark : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-1 text-xs font-medium text-gray-500">Biography</div>
          <div className="whitespace-pre-wrap text-base text-gray-800 dark:text-white/80">
            {bioText?.trim() ? bioText : "—"}
          </div>
        </div>
      </div>
    </section>
  );
}

