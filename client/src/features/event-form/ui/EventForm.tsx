import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";

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

import { assertIsDefined } from "@/shared/lib/assert";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { pluralDays } from "@/shared/lib/pluralDays";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { fromUnixTime } from "date-fns";
import { useEffect, useMemo } from "react";
import type { z } from "zod";
import { useFetchImage } from "../hooks/useFetchImage";
import { extractBookedRangesForPlace } from "../lib/extractBookedRangesForPlace";
import { getPlaceDefaults } from "../lib/getPlaceDefaults";
import { mapEventFormToEventDto, mapEventToEventForm } from "../lib/mapEvent";
import { createFormSchema } from "../model/formSchema";

type EventFormProps = {
  events: Event[];
  places: EventPlace[];
  onSumbit: (values: EventDto) => void;
  existingEvent?: Event;
};

const STORAGE_KEY = "event-form";

export const EventForm: React.FC<EventFormProps> = ({
  events,
  places,
  onSumbit: submitHandler,
  existingEvent,
}) => {
  if (!places[0])
    return (
      <ErrorMessage errors={new Error("No availible places to create event")} />
    );

  const eventForEdit = existingEvent
    ? mapEventToEventForm(existingEvent)
    : undefined;

  // TODO: Investigate why `useMemo` is required
  // Without it component failes with maximum useState call
  const eventIdsToExclude = useMemo(
    () => (existingEvent == null ? undefined : [existingEvent.id]),
    [existingEvent],
  );

  const formSchema = createFormSchema(places, events);

  const defaults = sessionStorage.getItem(STORAGE_KEY);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults
      ? JSON.parse(defaults)
      : existingEvent
        ? {
            ...eventForEdit,
            startDate: fromUnixTime(existingEvent.startDateTimestamp),
          }
        : {
            title: "",
            description: "",
            ...getPlaceDefaults(places[0], events, eventIdsToExclude),
          },
  });

  useFormPersist(STORAGE_KEY, {
    watch: form.watch,
    setValue: form.setValue,
    exclude: ["image"],
  });

  useFetchImage(form, existingEvent);

  const selectedPlace = places.find(
    (place) => `${place?.id}` === form.watch("place"),
  );
  const isSelected = !!selectedPlace;

  assertIsDefined(selectedPlace);
  const placeRanges = extractBookedRangesForPlace(
    events,
    selectedPlace,
    eventIdsToExclude,
  );

  useEffect(() => {
    const updatedValues = getPlaceDefaults(
      selectedPlace,
      events,
      eventIdsToExclude,
    );

    form.reset((values) => ({
      ...values,
      ...updatedValues,
    }));
  }, [selectedPlace, events, eventIdsToExclude, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const eventDto = mapEventFormToEventDto(values);
    submitHandler(eventDto);
  }

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
                <Textarea placeholder="Describe your event" {...field} />
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
                  Min Ticket Price: {selectedPlace.minPrice}{" "}
                  <img
                    src={getCurrencySymbol()}
                    className="h-6 aspect-square inline"
                    alt="currency"
                  />
                </li>
                <li>
                  Minimum duration: {selectedPlace.minDays}{" "}
                  {pluralDays(selectedPlace.minDays)}
                </li>
                <li>
                  Cancel: {selectedPlace.daysBeforeCancel}{" "}
                  {pluralDays(selectedPlace.daysBeforeCancel)} before event
                </li>
              </ul>
            </div>
          </div>
        )}
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
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <DatePicker
                  daysBeforeCancel={selectedPlace.daysBeforeCancel}
                  selectedDuration={form.watch("daysAmount")}
                  date={field.value}
                  setDate={field.onChange}
                  disabled={placeRanges}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                    {isSelected && (
                      <>
                        {` (minimum price ${minimumPrice} `}
                        <img
                          src={getCurrencySymbol()}
                          className="h-6 aspect-square inline"
                          alt="currency"
                        />
                      </>
                    )}
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
