import type { EventPlace } from "@/entities/place";
import type { EventFormType } from "../model/types";
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

import { createFormSchema } from "../model/formSchema";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";

type EventFormProps = {
  bookedRanges: DateRange[];
  places: EventPlace[];
  onSumbit: (values: EventFormType) => void;
  existingEvent?: EventFormType;
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
    submitHandler(values);
  }

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
        <FormField
          control={form.control}
          name="ticketPrice"
          render={({ field }) => {
            const selectedPlace = form.watch().place;
            const isSelected = selectedPlace !== "";

            const minimumPrice =
              places.find((place) => `${place.id}` === selectedPlace)
                ?.minPrice ?? 0;
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
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
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
            <FormItem>
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
        <Button type="submit" variant="default">
          Submit
        </Button>
      </form>
    </Form>
  );
};
