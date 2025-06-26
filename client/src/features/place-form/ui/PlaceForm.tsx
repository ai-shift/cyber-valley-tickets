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
import type { UseMutateFunction } from "@tanstack/react-query";
import { usePlacePersist } from "../hooks/usePlacePersist";
import { formSchema } from "../model/formSchema";

type PlaceFormProps = {
  existingPlace?: EventPlace;
  onSubmit: UseMutateFunction<unknown, Error, EventPlaceForm, unknown>;
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
      ? { ...existingPlace }
      : {
          title: "",
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
    submitHandler(values, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

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
