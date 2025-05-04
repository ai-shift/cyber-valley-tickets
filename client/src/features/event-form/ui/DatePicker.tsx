import type { DateRange } from "react-day-picker";
import type { SelectSingleEventHandler } from "react-day-picker";

import { format } from "date-fns";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

type DatePickerProps = {
  date: Date;
  setDate: SelectSingleEventHandler;
  disabled: DateRange[];
};

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  setDate,
  disabled,
}) => {
  return (
    <div className={cn("grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={date}
            disabled={[{ before: new Date() }, ...disabled]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
