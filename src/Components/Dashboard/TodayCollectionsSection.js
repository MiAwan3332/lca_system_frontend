import React from "react";
import {
  Banknote,
  HandCoins,
  Receipt,
  Smartphone,
} from "lucide-react";
import KpiCard from "./KpiCard";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const TODAY_COLLECTION_CARDS = [
  {
    key: "total",
    title: "Total Collected Today",
    helpText: "Cash + online fee collections today",
    icon: HandCoins,
  },
  {
    key: "online",
    title: "Online Collected",
    helpText: "Online / bank collections today",
    icon: Smartphone,
  },
  {
    key: "cash",
    title: "Cash Collected",
    helpText: "Cash collections today",
    icon: Banknote,
  },
  {
    key: "expenses",
    title: "Expenses Today",
    helpText: "Approved expenses today",
    icon: Receipt,
  },
];

function TodayCollectionsSection({
  totalCash = 0,
  totalOnline = 0,
  expensesToday = 0,
  batchWise = [],
  loading = false,
}) {
  const totalCollected = Number(totalCash || 0) + Number(totalOnline || 0);
  const values = {
    total: formatRs(totalCollected),
    online: formatRs(totalOnline),
    cash: formatRs(totalCash),
    expenses: formatRs(expensesToday),
  };

  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold dash-text">Today&apos;s Collections</h2>
        <p className="text-sm dash-text-muted">
          Cash, online, expenses, and batch-wise collections for today
        </p>
      </div>

      <div className="kpi-grid mb-4">
        {TODAY_COLLECTION_CARDS.map((item) => (
          <KpiCard
            key={item.key}
            title={item.title}
            value={values[item.key]}
            helpText={item.helpText}
            icon={item.icon}
            loading={loading}
          />
        ))}
      </div>

      <div className="dash-surface-card p-4 sm:p-5">
        <h3 className="text-base font-semibold dash-text mb-1">
          Batch-wise Collection Today
        </h3>
        <p className="text-sm dash-text-muted mb-4">
          Fee collections split by batch for today
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 dash-skeleton rounded-xl" />
            ))}
          </div>
        ) : batchWise.length === 0 ? (
          <p className="text-sm dash-text-muted py-2">
            No batch collections recorded today.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {batchWise.map((batch) => (
              <div
                key={batch.batch_id || batch.batch_name}
                className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-muted,#F8FAFC)] p-4"
              >
                <p className="text-sm font-semibold dash-text truncate">
                  {batch.batch_name || "Unassigned"}
                </p>
                <p className="mt-1 text-lg font-bold dash-text">
                  {formatRs(batch.total)}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs dash-text-muted">
                  <span>Cash: {formatRs(batch.total_cash)}</span>
                  <span>Online: {formatRs(batch.total_online)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TodayCollectionsSection;
