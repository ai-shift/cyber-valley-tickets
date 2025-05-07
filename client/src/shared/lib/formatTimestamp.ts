import { format, fromUnixTime } from "date-fns";

export const formatTimestamp = (timestamp: number) =>
  format(fromUnixTime(timestamp / 1000), "dd.LL.yyy");
