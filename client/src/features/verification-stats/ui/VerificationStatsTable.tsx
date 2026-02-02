import { DisplayUser } from "@/features/display-user";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { verificationStatsQueries } from "../api/verificationStatsQueries";
import { formatDuration } from "../lib/formatDuration";
import { DiffBadge } from "./DiffBadge";

interface WeekStats {
  pending: number;
  verified: number;
  averageVerificationTime: number;
}

interface Diff {
  pending: number;
  verified: number;
}

interface ProviderData {
  address: string;
  currentWeek: WeekStats;
  previousWeek: WeekStats;
  diff: Diff;
}

interface EntityData {
  providers: ProviderData[];
}

interface VerificationStats {
  places: EntityData;
  events: EntityData;
  shamans: EntityData;
}

type TabType = "places" | "events" | "shamans";

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-0 border-l transition-colors ${
      active
        ? "border-l-primary text-primary bg-transparent"
        : "border-l-secondary/30 text-gray-400 hover:border-l-secondary/50 hover:text-gray-300"
    }`}
  >
    {children}
  </button>
);

/**
 * Compact stats cell showing P (pending), V (verified), and time
 * Format: P:1 V:4 (2h)
 */
const CompactStatsCell: React.FC<{ stats: WeekStats }> = ({ stats }) => (
  <div className="flex flex-col gap-0.5 text-sm">
    <div className="flex items-center gap-2">
      <span className="text-yellow-400">P:{stats.pending}</span>
      <span className="text-green-400">V:{stats.verified}</span>
    </div>
    <div className="text-gray-400 text-xs">
      {stats.averageVerificationTime > 0
        ? formatDuration(stats.averageVerificationTime)
        : "-"}
    </div>
  </div>
);

const StatsTable: React.FC<{ data: EntityData; entityType: string }> = ({
  data,
  entityType,
}) => {
  if (!data.providers || data.providers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No {entityType} verification data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[500px]">
        <thead>
          <tr className="border-b border-primary">
            <th className="py-3 px-3 text-primary font-semibold sticky left-0 bg-background z-10 min-w-[150px]">
              Provider
            </th>
            <th className="py-3 px-3 text-primary font-semibold">
              Current Week
            </th>
            <th className="py-3 px-3 text-primary font-semibold">
              Previous Week
            </th>
            <th className="py-3 px-3 text-primary font-semibold">Diff</th>
          </tr>
        </thead>
        <tbody>
          {data.providers.map((providerData) => (
            <tr
              key={providerData.address}
              className="border-b border-secondary/30"
            >
              <td className="py-3 px-3 sticky left-0 bg-background z-10">
                <DisplayUser address={providerData.address} />
              </td>
              <td className="py-3 px-3">
                <CompactStatsCell stats={providerData.currentWeek} />
              </td>
              <td className="py-3 px-3">
                <CompactStatsCell stats={providerData.previousWeek} />
              </td>
              <td className="py-3 px-3">
                <div className="flex flex-col gap-1">
                  <DiffBadge value={providerData.diff.pending} label="P" />
                  <DiffBadge value={providerData.diff.verified} label="V" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const VerificationStatsTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("places");
  const { data, isLoading, error } = useQuery(verificationStatsQueries.stats());

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage errors={error} />;
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        No verification data available.
      </div>
    );
  }

  const stats = data as VerificationStats;

  return (
    <div className="w-full">
      <div className="flex gap-1 border-b border-secondary/30 mb-4 overflow-x-auto">
        <TabButton
          active={activeTab === "places"}
          onClick={() => setActiveTab("places")}
        >
          Places
        </TabButton>
        <TabButton
          active={activeTab === "events"}
          onClick={() => setActiveTab("events")}
        >
          Events
        </TabButton>
        <TabButton
          active={activeTab === "shamans"}
          onClick={() => setActiveTab("shamans")}
        >
          Shamans
        </TabButton>
      </div>

      <div className="mt-4">
        {activeTab === "places" && (
          <StatsTable data={stats.places} entityType="places" />
        )}
        {activeTab === "events" && (
          <StatsTable data={stats.events} entityType="events" />
        )}
        {activeTab === "shamans" && (
          <StatsTable data={stats.shamans} entityType="shamans" />
        )}
      </div>
    </div>
  );
};
