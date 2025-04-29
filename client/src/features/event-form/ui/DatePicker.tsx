import type { DateRange } from "react-day-picker";

import { format } from "date-fns";

import { PopoverTrigger, Popover, PopoverContent } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { cn } from "@/shared/lib/utils";

type DatePickerProps = {
  date: Date;
  setDate: (...event: unknown[]) => void;
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
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
