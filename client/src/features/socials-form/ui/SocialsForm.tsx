import type { Socials } from "@/entities/user";
import type { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { createTelegramLinkToken, userQueries } from "@/entities/user";
import animationData from "@/lotties/vagina.json";
import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
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
import { useQuery } from "@tanstack/react-query";
import Lottie from "lottie-react";
import { formSchema } from "../model/formSchema";
import { SelectNetwork } from "./SelectNetwork";

type SocialsFormProps = {
  onSubmit: (values: Socials) => void;
  existingSocials?: Socials;
  userAddress: string;
};

const POLLING_DURATION_MS = 30000; // 30 seconds
const POLLING_INTERVAL_MS = 2000; // 2 seconds

export const SocialsForm: React.FC<SocialsFormProps> = ({
  onSubmit: submitHandler,
  existingSocials,
  userAddress: _userAddress,
}) => {
  const [isTelegramAwaiting, setIsTelegramAwaiting] = useState(false);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pollingElapsed, setPollingElapsed] = useState(0);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
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
    refetchInterval: isTelegramAwaiting ? POLLING_INTERVAL_MS : false,
  });

  // Handle polling timeout
  useEffect(() => {
    if (!isTelegramAwaiting) return;

    const interval = setInterval(() => {
      setPollingElapsed((prev) => {
        const next = prev + POLLING_INTERVAL_MS;
        if (next >= POLLING_DURATION_MS) {
          // Stop polling after 30 seconds
          setIsTelegramAwaiting(false);
          return 0;
        }
        return next;
      });
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isTelegramAwaiting]);

  useEffect(() => {
    if (selectedNetwork !== "telegram") {
      setIsTelegramAwaiting(false);
      setIsTelegramLinked(false);
      setPollingElapsed(0);
      return;
    }
    if (existingSocials?.network === "telegram") {
      setIsTelegramLinked(true);
      return;
    }
    const hasTelegram = currentUser?.socials?.some(
      (social) => social.network === "telegram",
    );
    if (hasTelegram && isTelegramAwaiting) {
      setIsTelegramLinked(true);
      setIsTelegramAwaiting(false);
      setShowSuccessModal(true);
    }
  }, [
    currentUser?.socials,
    existingSocials?.network,
    selectedNetwork,
    isTelegramAwaiting,
  ]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitHandler({ network: values.network, value: values.value || "" });
  }

  async function handleTelegramConnect() {
    setTokenError(null);
    setIsGeneratingToken(true);

    try {
      const response = await createTelegramLinkToken("link");
      if (response.error) {
        setTokenError("Failed to generate Telegram link. Please try again.");
        return;
      }
      const { hash } = response.data;
      window.open(`https://t.me/MimiThePresidentBot?start=${hash}`, "_blank");
      setIsTelegramAwaiting(true);
      setPollingElapsed(0);
    } catch {
      setTokenError("Failed to generate Telegram link. Please try again.");
    } finally {
      setIsGeneratingToken(false);
    }
  }

  function handleSuccessModalClose() {
    setShowSuccessModal(false);
  }

  const remainingSeconds = Math.ceil(
    (POLLING_DURATION_MS - pollingElapsed) / 1000,
  );

  return (
    <>
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
                disabled={isTelegramLinked || isGeneratingToken}
              >
                {isGeneratingToken
                  ? "Generating secure link..."
                  : isTelegramLinked
                    ? "Telegram connected"
                    : "Verify via Telegram bot"}
              </Button>
              {tokenError && (
                <p className="text-sm text-red-500 text-center">{tokenError}</p>
              )}
              {isTelegramAwaiting && !isTelegramLinked && (
                <div className="space-y-2">
                  <p className="text-sm text-muted text-center">
                    Waiting for Telegram verification... ({remainingSeconds}s
                    remaining)
                  </p>
                  <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-1000"
                      style={{
                        width: `${(pollingElapsed / POLLING_DURATION_MS) * 100}%`,
                      }}
                    />
                  </div>
                </div>
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

      {/* Success Modal with Vagina Animation */}
      <CustomModal open={showSuccessModal} setOpen={setShowSuccessModal}>
        <CustomModalWindow>
          <div className="flex flex-col gap-4">
            <div className="w-48 h-48 mx-auto">
              <Lottie animationData={animationData} loop={false} />
            </div>
            <h2 className="text-muted font-semibold text-lg text-center">
              Telegram Connected!
            </h2>
            <p className="text-muted/70 text-md text-center">
              Your Telegram has been successfully linked to your account.
            </p>
            <Button className="mx-auto block" onClick={handleSuccessModalClose}>
              Awesome
            </Button>
          </div>
        </CustomModalWindow>
      </CustomModal>
    </>
  );
};
