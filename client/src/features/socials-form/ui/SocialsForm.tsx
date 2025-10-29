import type { Socials } from "@/entities/user";
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
  existingSocials?: Socials;
  userAddress: string;
};

export const SocialsForm: React.FC<SocialsFormProps> = ({
  onSubmit: submitHandler,
  existingSocials,
  userAddress,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingSocials
      ? existingSocials
      : { network: "telegram", value: "" },
  });

  const selectedNetwork = form.watch("network");

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitHandler(values);
  }

  function handleTelegramConnect() {
    window.open(
      `https://t.me/cyberia_tickets_bot?start=${userAddress}`,
      "_blank"
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-10">
        <FormField
          control={form.control}
          name="network"
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
        {selectedNetwork === "telegram" ? (
          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleTelegramConnect}
              className="w-full"
            >
              Verify via Telegram bot
            </Button>
          </div>
        ) : (
          <>
            <FormField
              control={form.control}
              name="value"
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
          </>
        )}
      </form>
    </Form>
  );
};
