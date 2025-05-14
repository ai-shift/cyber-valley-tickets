import type { EventPlace } from "@/entities/place";
import type { DateRange } from "react-day-picker";
import type { SelectSingleEventHandler } from "react-day-picker";

import { format } from "date-fns";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useState } from "react";
import { addDays, isDateAvailable } from "../model/formSchema";

type DatePickerProps = {
  date: Date;
  setDate: SelectSingleEventHandler;
  disabled: DateRange[];
  place: EventPlace;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  setDate,
  disabled: disabledRanges,
  place,
}) => {
  const [open, setOpen] = useState(false);

  console.log(disabledRanges);

  const disabledDays = () => {
    const disabled = [];

    for (let i = 0; i <= 255; i++) {
      const date = addDays(new Date(), i);
      if (
        !isDateAvailable(
          date,
          place.minDays,
          place.daysBeforeCancel,
          disabledRanges,
        )
      )
        disabled.push(date);
    }

    return disabled;
  };

  //   console.log(disabledDays());

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            clipping="noclip"
            className={cn(
              "border-2 border-input text-primary-foreground bg-input/10 p-5 w-full",
              "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
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
            onSelect={(day, selectedDay, activeModifiers, e) => {
              setDate(day, selectedDay, activeModifiers, e);
              setOpen(false);
            }}
            defaultMonth={date}
            disabled={[...disabledDays()]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
