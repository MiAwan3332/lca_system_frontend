import React from "react";
import {
  FormControl,
  Input,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { FilterX, RotateCw } from "lucide-react";
import SearchableBatchSelect from "../SearchableBatchSelect";

function DashboardHeader({
  greeting,
  subtitle,
  role,
  loading = false,
  showFilters = false,
  batches = [],
  formBatch = "",
  formStartDate = "",
  formEndDate = "",
  onBatchChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onReload,
}) {
  return (
    <div className="dash-surface-card p-5 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium dash-text-accent uppercase tracking-wide">
            {role || "Dashboard"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold dash-text tracking-tight mt-1">
            {greeting}
          </h1>
          {subtitle && (
            <p className="text-sm dash-text-muted mt-2 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
              <SearchableBatchSelect
                batches={batches}
                value={formBatch}
                onChange={onBatchChange}
                placeholder="Filter batch"
                width="100%"
              />
            </FormControl>
            <FormControl w={{ base: "full", md: "10rem" }}>
              <Input
                type="date"
                size="md"
                borderRadius="xl"
                value={formStartDate}
                onChange={onStartDateChange}
              />
            </FormControl>
            <FormControl w={{ base: "full", md: "10rem" }}>
              <Input
                type="date"
                size="md"
                borderRadius="xl"
                value={formEndDate}
                onChange={onEndDateChange}
              />
            </FormControl>
            <Button size="sm" borderRadius="xl" variant="outline" onClick={onClearFilters}>
              <FilterX size={16} className="mr-1" />
              Clear
            </Button>
            <IconButton
              aria-label="Reload statistics"
              icon={<RotateCw size={18} />}
              borderRadius="full"
              variant="outline"
              onClick={onReload}
              className={loading ? "animate-spin" : ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardHeader;
