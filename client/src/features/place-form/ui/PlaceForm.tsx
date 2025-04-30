import type { EventPlaceForm } from "../model/types";
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

import { formSchema } from "../model/formSchema";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";

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
          daysBeforeCancel: 0,
          minDays: 0,
          minPrice: 0,
        },
  });

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
        <FormField
          control={form.control}
          name="minTickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum tickets</FormLabel>
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
        <FormField
          control={form.control}
          name="maxTickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum tickets</FormLabel>
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
        <FormField
          control={form.control}
          name="minDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum days</FormLabel>
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
        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum price</FormLabel>
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
        <FormField
          control={form.control}
          name="daysBeforeCancel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days before cancel</FormLabel>
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
