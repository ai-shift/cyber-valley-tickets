import { Button } from "@/shared/ui/button";
import type { EmblaOptionsType } from "embla-carousel";
import { useState } from "react";
import { TimePickerItem } from "./TimePickerItem";

type PropType = {
  loop?: EmblaOptionsType["loop"];
  initialValue: StateType;
  setValue: (time: StateType) => void;
};

type StateType = {
  hours: number;
  minutes: number;
};

export const TimePicker: React.FC<PropType> = ({
  loop,
  initialValue,
  setValue,
}) => {
  const [time, setTime] = useState<StateType>(initialValue);

  function updateTime(key: string, value: number) {
    setTime((prev) => ({ ...prev, [key]: value }));
  }

  const curriedUpdateTime = (a: string) => (b: number) => updateTime(a, b);

  return (
    <div>
      <div className="embla">
        <TimePickerItem
          value={time.hours}
          setValue={curriedUpdateTime("hours")}
          slideCount={24}
          perspective="left"
          loop={loop}
        />
        <p className="text-3xl -translate-y-1">:</p>
        <TimePickerItem
          value={time.minutes}
          setValue={curriedUpdateTime("minutes")}
          slideCount={60}
          perspective="right"
          loop={loop}
        />
      </div>
      <Button className="mx-auto block" onClick={() => setValue(time)}>
        Update time
      </Button>
    </div>
  );
};
