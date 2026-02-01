import type { Socials } from "@/entities/user";
import type { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
import { userQueries } from "@/entities/user";
import { useQuery } from "@tanstack/react-query";
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
  const [isTelegramAwaiting, setIsTelegramAwaiting] = useState(false);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingSocials
      ? existingSocials
      : { network: "telegram", value: "" },
  });

  const selectedNetwork = form.watch("network");

  const { data: currentUser } = useQuery({
    ...userQueries.current(),
    enabled: selectedNetwork === "telegram" && isTelegramAwaiting,
    refetchInterval: isTelegramAwaiting ? 3000 : false,
  });

  useEffect(() => {
    if (selectedNetwork !== "telegram") {
      setIsTelegramAwaiting(false);
      setIsTelegramLinked(false);
      return;
    }
    if (existingSocials?.network === "telegram") {
      setIsTelegramLinked(true);
      return;
    }
    const hasTelegram = currentUser?.socials?.some(
      (social) => social.network === "telegram",
    );
    if (hasTelegram) {
      setIsTelegramLinked(true);
      setIsTelegramAwaiting(false);
    }
  }, [currentUser?.socials, existingSocials?.network, selectedNetwork]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitHandler({ network: values.network, value: values.value || "" });
  }

  function handleTelegramConnect() {
    window.open(
      `https://t.me/cyberia_tickets_bot?start=${userAddress}`,
      "_blank",
    );
    setIsTelegramAwaiting(true);
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
              disabled={isTelegramLinked}
            >
              {isTelegramLinked ? "Telegram connected" : "Verify via Telegram bot"}
            </Button>
            {isTelegramAwaiting && !isTelegramLinked && (
              <p className="text-sm text-muted text-center">
                Waiting for Telegram verification...
              </p>
            )}
            {isTelegramLinked && (
              <p className="text-sm text-green-500 text-center">
                Telegram connected successfully.
              </p>
            )}
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
