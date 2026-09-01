import React from "react";
import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import {
  CircleDollarSign,
  HandCoins,
  Receipt,
  Wallet,
} from "lucide-react";
import KpiCard from "./KpiCard";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

function TodayCollectionsSection({
  totalCash = 0,
  totalOnline = 0,
  expensesToday = 0,
  batchWise = [],
  loading = false,
  adminUsers = [],
  selectedUserId = "",
  onUserChange,
  selectedUserLabel = "All users",
}) {
  const totalCollected = Number(totalCash || 0) + Number(totalOnline || 0);
  const netAfterExpenses = totalCollected - Number(expensesToday || 0);

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold dash-text">
            Daily Collection
          </h2>
          <p className="text-sm dash-text-muted">
            {selectedUserId
              ? `Collections for ${selectedUserLabel} today`
              : "Today’s total, cash, online, and batch-wise collections"}
          </p>
        </div>
        <FormControl className="responsive-input" w={{ base: "full", sm: "16rem" }}>
          <FormLabel fontSize="xs" mb={1} color="gray.500">
            Filter by user
          </FormLabel>
          <Select
            size="md"
            borderRadius="xl"
            value={selectedUserId}
            onChange={(e) => onUserChange?.(e.target.value)}
            bg="white"
          >
            <option value="">All users</option>
            {adminUsers.map((admin) => (
              <option key={admin._id} value={admin._id}>
                {admin.name}
                {admin.role ? ` (${admin.role})` : ""}
              </option>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="kpi-grid mb-4">
        <KpiCard
          title="Daily Collection"
          value={formatRs(totalCollected)}
          helpText="Cash + online collected today"
          icon={HandCoins}
          loading={loading}
        />

        <div className="dash-surface-card p-5 sm:p-6 flex justify-between items-start gap-4 min-h-[132px] hover:shadow-md transition-shadow duration-300">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium dash-text-muted">
              Online &amp; Cash Collected
            </p>
            {loading ? (
              <div className="mt-2 space-y-2">
                <div className="h-7 w-32 dash-skeleton rounded-lg" />
                <div className="h-7 w-28 dash-skeleton rounded-lg" />
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm dash-text-muted">Online</span>
                  <span className="text-xl sm:text-2xl font-bold dash-text tracking-tight">
                    {formatRs(totalOnline)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm dash-text-muted">Cash</span>
                  <span className="text-xl sm:text-2xl font-bold dash-text tracking-tight">
                    {formatRs(totalCash)}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs sm:text-sm dash-text-muted leading-snug">
              Online / bank and cash collections today
            </p>
          </div>
          <div className="shrink-0 p-2.5 sm:p-3 bg-[#d69e2e]/30 rounded-lg">
            <Wallet size={28} style={{ color: "var(--dash-icon)" }} strokeWidth={2} />
          </div>
        </div>

        <KpiCard
          title="Expenses Today"
          value={formatRs(expensesToday)}
          helpText="Approved expenses today"
          icon={Receipt}
          loading={loading}
        />
        <KpiCard
          title="Net After Expenses"
          value={formatRs(netAfterExpenses)}
          helpText="Daily collection minus expenses"
          icon={CircleDollarSign}
          loading={loading}
        />
      </div>

      <div className="dash-surface-card p-4 sm:p-5">
        <h3 className="text-base font-semibold dash-text mb-1">
          Batch-wise Collection Today
        </h3>
        <p className="text-sm dash-text-muted mb-4">
          {selectedUserId
            ? `Cash and online collections by ${selectedUserLabel}, split by batch`
            : "Cash and online collections split by batch for today"}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 dash-skeleton rounded-xl" />
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/70 dark:bg-black/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide dash-text-muted">
                      Cash
                    </p>
                    <p className="text-sm font-semibold dash-text">
                      {formatRs(batch.total_cash)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 dark:bg-black/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide dash-text-muted">
                      Online
                    </p>
                    <p className="text-sm font-semibold dash-text">
                      {formatRs(batch.total_online)}
                    </p>
                  </div>
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
