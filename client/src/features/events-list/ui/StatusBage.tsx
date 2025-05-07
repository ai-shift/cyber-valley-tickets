import type { EventStatus } from "@/entities/event";

type StatusBageProps = {
  status: EventStatus;
};
export const StatusBage: React.FC<StatusBageProps> = ({ status }) => {
  if (!status) return;

  type StatusTypes = {
    [key in Exclude<EventStatus, undefined>]: [string, string];
  };

  const results: StatusTypes = {
    approved: ["bg-green-500", "Approved"],
    submitted: ["bg-yellow-400", "Pending"],
    declined: ["bg-red-400", "Rejected"],
    closed: ["bg-gray-200", "Finished"],
    cancelled: ["bg-red-200", "Canceled"],
  };

  const [bgColor, text] = results[status];

  return <p className={`px-3 py-1 ${bgColor}`}>{text}</p>;
};
