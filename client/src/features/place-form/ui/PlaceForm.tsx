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

import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { formSchema } from "../model/formSchema";

type PlaceFormProps = {
  existingPlace?: EventPlaceForm;
};

export const PlaceForm: React.FC<PlaceFormProps> = ({ existingPlace }) => {
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
        },
  });

  // TODO: Add smart contract call
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-3">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <CustomFormComponent
          control={form.control}
          fieldName="minTickets"
          title="Minimum tickets amount"
        />
        <CustomFormComponent
          control={form.control}
          fieldName="maxTickets"
          title="Maximum tickets amount"
        />
        <CustomFormComponent
          control={form.control}
          fieldName="minDays"
          title="Minimum days"
        />
        <CustomFormComponent
          control={form.control}
          fieldName="minPrice"
          title="Minimum price"
        />
        <CustomFormComponent
          control={form.control}
          fieldName="daysBeforeCancel"
          title="Days before cancel"
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

type CustomFormComponent = {
  control: Control<EventPlaceForm, unknown, EventPlaceForm>;
  fieldName:
    | "maxTickets"
    | "minTickets"
    | "minPrice"
    | "minDays"
    | "daysBeforeCancel";
  title: string;
};

const CustomFormComponent = ({
  control,
  fieldName,
  title,
}: CustomFormComponent) => {
  return (
    <FormField
      control={control}
      name={fieldName}
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
