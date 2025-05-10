import type { EventPlace } from "@/entities/place";
import type { DateRange } from "react-day-picker";
import type { z } from "zod";

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

import type { Event, EventDto } from "@/entities/event";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { fromUnixTime } from "date-fns";
import { useEffect } from "react";
import { mapEventFormToEventDto, mapEventToEventForm } from "../lib/mapEvent";
import { createFormSchema } from "../model/formSchema";

type EventFormProps = {
  bookedRanges: DateRange[];
  places: EventPlace[];
  onSumbit: (values: EventDto) => void;
  existingEvent?: Event;
};

export const EventForm: React.FC<EventFormProps> = ({
  bookedRanges,
  places,
  onSumbit: submitHandler,
  existingEvent,
}) => {
  useEffect(() => {
    if (!existingEvent?.imageUrl) return;

    async function getFileFromUrl(url: string, filename: string) {
      const response = await fetch(url);
      const contentType = response.headers.get("Content-Type");
      const blob = await response.blob();
      return new File([blob], filename, { type: contentType?.toString() });
    }

    getFileFromUrl(
      existingEvent.imageUrl,
      `Жопа-${Math.floor(Math.random() * 1000)}`,
    ).then((data) => form.setValue("image", data));
  }, [existingEvent?.imageUrl]);

  const eventForEdit = existingEvent
    ? mapEventToEventForm(existingEvent)
    : undefined;

  const formSchema = createFormSchema(places, bookedRanges);
  const addDays = (date: Date, days: number) =>
    new Date(date.setDate(date.getDate() + days));
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingEvent
      ? {
          ...eventForEdit,
          startDate: fromUnixTime(existingEvent.startDateTimestamp),
        }
      : {
          title: "",
          description: "",
          ticketPrice: 0,
          place: places[0] ? `${places[0].id}` : "",
          startDate: places[0]
            ? addDays(new Date(), places[0].daysBeforeCancel + 2)
            : new Date(),
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
        className="grid grid-rows gap-5 px-3 py-5"
      >
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event image</FormLabel>
              <FormLabel>
                {field.value ? (
                  <img
                    className="w-full aspect-video object-contain"
                    src={URL.createObjectURL(field.value)}
                    alt="sd"
                  />
                ) : (
                  <div className="text-center border-2 border-input bg-input/10 p-5 w-full aspect-video flex flex-col justify-center">
                    <h2 className="text-secondary">Upload image banner</h2>
                    <p className="text-normal font-normal text-muted-foreground lowercase">
                      Click to upload image (16:9 ratio recommended)
                    </p>
                  </div>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="file"
                  hidden
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      field.onChange(e.target.files[0]);
                    } else {
                      field.onChange(undefined);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
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
              <FormLabel>Event description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your event"
                  {...field}
                  {...form.register(field.name)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          <div className="text-secondary border-2 border-secondary p-4">
            <div>
              <h3 className="font-bold mb-2 text-lg">{selectedPlace.title}</h3>
              <ul className=" space-y-1 text-md text-muted">
                <li>Min Tickets: {selectedPlace.minTickets}</li>
                <li>Max Tickets: {selectedPlace.maxTickets}</li>
                <li>
                  Cancel Days: {selectedPlace.daysBeforeCancel} days before
                  event
                </li>
                <li>
                  Min Ticket Price: {selectedPlace.minPrice}{" "}
                  {getCurrencySymbol()}
                </li>
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
                  <span
                    className={`${!isSelected ? "text-gray-500" : "text-secondary"}`}
                  >
                    Ticket price
                    {!isSelected && " (select the place to enter the price)"}
                    {isSelected &&
                      ` (minimum price ${minimumPrice} ${getCurrencySymbol()})`}
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
        <Button className="block mx-auto" type="submit" variant="default">
          Submit
        </Button>
      </form>
    </Form>
  );
};
