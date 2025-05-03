import type { EventPlace } from "@/entities/place";
import type { DateRange } from "react-day-picker";
import type { z } from "zod";
import type { EventFormInput } from "../model/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { DatePicker } from "./DatePicker";
import { PlaceSelect } from "./PlaceSelect";

import type { EventDto } from "@/entities/event";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { mapEventFormToEventDto } from "../lib/mapEvent";
import { createFormSchema } from "../model/formSchema";

type EventFormProps = {
  bookedRanges: DateRange[];
  places: EventPlace[];
  onSumbit: (values: EventDto) => void;
  existingEvent?: EventFormInput;
};

export const EventForm: React.FC<EventFormProps> = ({
  bookedRanges,
  places,
  onSumbit: submitHandler,
  existingEvent,
}) => {
  const formSchema = createFormSchema(places, bookedRanges);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingEvent
      ? { ...existingEvent }
      : {
          title: "Title",
          description: "Long ass description to satisfy the f*king form",
          ticketPrice: 0,
          place: "",
          startDate: new Date(),
          daysAmount: 1,
        },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const eventDto = mapEventFormToEventDto(values);
    submitHandler(eventDto);
  }

  const selectedPlace = places.find(
    (place) => `${place.id}` === form.watch("place"),
  );
  const isSelected = !!selectedPlace;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 px-3 py-5"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} {...form.register(field.name)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      field.onChange(e.target.files[0]);
                    } else {
                      field.onChange(undefined);
                    }
                  }}
                />
              </FormControl>
              {field.value && (
                <img src={URL.createObjectURL(field.value)} alt="sd" />
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    disabled={bookedRanges}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="daysAmount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Duration in days</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    {...field}
                    onChange={(e) =>
                      field.onChange(handleNumericInput(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="place"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place</FormLabel>
              <PlaceSelect
                value={field.value}
                onChange={field.onChange}
                places={places}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {isSelected && (
          <div className="">
            <div>
              <h3 className="text-[#02d7f2] font-bold mb-2">
                {selectedPlace.title}
              </h3>
              <ul className=" space-y-1">
                <li>Min Tickets: {selectedPlace.minTickets}</li>
                <li>Max Tickets: {selectedPlace.maxTickets}</li>
                <li>
                  Cancel Days: {selectedPlace.daysBeforeCancel} days before
                  event
                </li>
                <li>Min Ticket Price: {selectedPlace.minPrice} USDT</li>
              </ul>
            </div>
          </div>
        )}
        <FormField
          control={form.control}
          name="ticketPrice"
          render={({ field }) => {
            const minimumPrice = selectedPlace?.minPrice ?? 0;
            return (
              <FormItem>
                <FormLabel>
                  <span className={`${!isSelected && "text-gray-500"}`}>
                    Ticket price{" "}
                    {!isSelected && "(select the place to enter the price)"}
                    {isSelected && `(minimum price ${minimumPrice})`}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={!isSelected}
                    type="text"
                    inputMode="numeric"
                    onChange={(e) =>
                      field.onChange(handleNumericInput(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button type="submit" variant="default">
          Submit
        </Button>
      </form>
    </Form>
  );
};
