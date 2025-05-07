import { format, fromUnixTime } from "date-fns";

export const formatTimestamp = (timestamp: number) =>
  format(fromUnixTime(timestamp), "dd.LL.yyy");
