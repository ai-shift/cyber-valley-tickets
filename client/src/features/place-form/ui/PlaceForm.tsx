import { useState } from "react";
import type { z } from "zod";
import type { EventPlaceForm } from "../model/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Control, useForm } from "react-hook-form";

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

import type { EventPlace } from "@/entities/place";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { Switch } from "@/shared/ui/switch";
import { usePlacePersist } from "../hooks/usePlacePersist";
import { formSchema } from "../model/formSchema";

import type { LatLng } from "@/entities/geodata";
import { EbaliMap } from "@/features/map";
import { DisplayPlaces } from "@/features/map/ui/DisplayPlaces";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { twMerge } from "tailwind-merge";

type PlaceFormProps = {
  existingPlace?: EventPlace;
  onSubmit: (values: EventPlaceForm) => void;
  disableFields: boolean;
};

export const PlaceForm: React.FC<PlaceFormProps> = ({
  existingPlace,
  onSubmit: submitHandler,
  disableFields,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingPlace
      ? {
          ...existingPlace,
          geometry: existingPlace.geometry.coordinates[0] as LatLng,
        }
      : {
          title: "",
          geometry: null,
          minTickets: 1,
          maxTickets: 100,
          daysBeforeCancel: 1,
          minDays: 1,
          minPrice: 1,
          available: true,
        },
  });

  !existingPlace && usePlacePersist(form);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitHandler(values);
  }

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);

  const formLocation = form.watch("geometry");
  const setFormLocation = (coords: LatLng | null) =>
    form.setValue("geometry", coords);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-7 mb-10"
      >
        <FormField
          control={form.control}
          disabled={disableFields}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Place's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="geometry"
          render={() => {
            return (
              <FormItem>
                <FormLabel>Place location</FormLabel>
                <div className="relative">
                  <p
                    className={twMerge(
                      "absolute pointer-events-none top-0 left-1 z-1 transition-all duration-500",
                      (selectedLocation || formLocation) && "opacity-0",
                    )}
                  >
                    Long press to place marker
                  </p>
                  <EbaliMap
                    initialCenter={formLocation ?? undefined}
                    className={twMerge(
                      "h-[55dvh] transition-all duration-300",
                      selectedLocation && "h-[40dvh]",
                      formLocation && "h-[30dvh]",
                    )}
                    longPressHandler={
                      formLocation
                        ? () => {}
                        : (latLng) => {
                            form.clearErrors("geometry");
                            setSelectedLocation(latLng);
                          }
                    }
                  >
                    <DisplayPlaces removedPlaces={existingPlace && [existingPlace]} />
                    {selectedLocation && (
                      <AdvancedMarker position={selectedLocation}>
                        <Pin
                          background={"#ffc107"}
                          borderColor={"#ff9800"}
                          glyphColor={"#ffe082"}
                        />
                      </AdvancedMarker>
                    )}
                    {formLocation && (
                      <AdvancedMarker position={formLocation}>
                        <Pin
                          background={"#76ff05"}
                          borderColor={"#006400"}
                          glyphColor={"#b2ff59"}
                        />
                      </AdvancedMarker>
                    )}
                  </EbaliMap>
                  <FormMessage />
                  {selectedLocation && (
                    <div className="py-1">
                      <p className="text-lg py-2">Place set correctly?</p>
                      <div className="flex flex-row justify-between items-center">
                        <Button
                          variant="secondary"
                          className="w-1/4"
                          onClick={() => {
                            setFormLocation(selectedLocation);
                            form.clearErrors("geometry");
                            setSelectedLocation(null);
                          }}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-1/4"
                          onClick={() => setSelectedLocation(null)}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  )}
                  {formLocation && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => {
                        setSelectedLocation(formLocation);
                        setFormLocation(null);
                      }}
                    >
                      Change
                    </Button>
                  )}
                </div>
              </FormItem>
            );
          }}
        />
        <CustomFormComponent
          control={form.control}
          fieldDisabled={disableFields}
          fieldName="minTickets"
          title="Minimum tickets amount"
        />
        <CustomFormComponent
          control={form.control}
          fieldDisabled={disableFields}
          fieldName="maxTickets"
          title="Maximum tickets amount"
        />
        <CustomFormComponent
          control={form.control}
          fieldDisabled={disableFields}
          fieldName="minDays"
          title="Minimum days"
        />
        <CustomFormComponent
          control={form.control}
          fieldDisabled={disableFields}
          fieldName="minPrice"
          title="Minimum price"
        />
        <CustomFormComponent
          control={form.control}
          fieldDisabled={disableFields}
          fieldName="daysBeforeCancel"
          title="Days before cancel"
        />
        <FormField
          control={form.control}
          name={"available"}
          disabled={disableFields}
          render={({ field }) => (
            <FormItem className="flex justify-between items-center">
              <FormLabel>Available</FormLabel>
              <FormControl>
                <Switch
                  className="h-12"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <span className="self-center">
          <Button className="text-lg p-5" type="submit">
            Submit
          </Button>
        </span>
      </form>
    </Form>
  );
};

type CustomFormComponentProps = {
  control: Control<EventPlaceForm, unknown, EventPlaceForm>;
  fieldName:
    | "maxTickets"
    | "minTickets"
    | "minPrice"
    | "minDays"
    | "daysBeforeCancel";
  title: string;
  fieldDisabled: boolean;
};

const CustomFormComponent = ({
  control,
  fieldName,
  title,
  fieldDisabled,
}: CustomFormComponentProps) => {
  return (
    <FormField
      control={control}
      name={fieldName}
      disabled={fieldDisabled}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{title}</FormLabel>
          <FormControl>
            <Input
              placeholder=""
              inputMode="numeric"
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
  );
};
