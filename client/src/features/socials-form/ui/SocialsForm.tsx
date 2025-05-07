import type { Socials } from "@/entities/order";
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
import { SelectNetwork } from "./SelectNetwork";

type SocialsFormProps = {
  onSubmit: (values: Socials) => void;
};

export const SocialsForm: React.FC<SocialsFormProps> = ({
  onSubmit: submitHandler,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "", contactInfo: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitHandler(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-10">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network</FormLabel>
              <FormControl>
                <SelectNetwork
                  networkName={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact information</FormLabel>
              <FormControl>
                <Input placeholder="@johndoe" {...field} />
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
