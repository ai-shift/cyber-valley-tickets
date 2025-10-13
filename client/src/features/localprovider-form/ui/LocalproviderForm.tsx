import { useLocalproviderState } from "@/entities/localprovider";
import { useSendTx } from "@/shared/hooks";
import { handleNumericInput } from "@/shared/lib/handleNumericInput";
import { grantLocalProvider } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useActiveAccount } from "thirdweb/react";
import type { z } from "zod";
import { formSchema } from "../model/formSchema";

export const LocalproviderForm: React.FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      share: 50,
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const account = useActiveAccount();
  const { sendTx, data: txHash, error, isLoading } = useSendTx();
  const { optimisticAddLocalprovider } = useLocalproviderState();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (account == null) {
      throw new Error("Account isn't connected");
    }
    sendTx(
      grantLocalProvider(account, values.address, values.share).then(() => {
        setIsOpen(true);
        optimisticAddLocalprovider(values.address);
        form.reset();
      }),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local provider address</FormLabel>
              <FormControl>
                <Input placeholder="Enter string starting with 0x" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="share"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share with Local provider</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) =>
                    field.onChange(handleNumericInput(e.target.value))
                  }
                  placeholder="Enter the whole number between 0 and 100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isLoading ? (
          <Loader />
        ) : (
          <Button type="submit" className="w-full">
            Submit
          </Button>
        )}
        <ResultDialog
          open={isOpen}
          setOpen={setIsOpen}
          title="Transaction sent!"
          body={"Local provider role will be granted soon."}
          onConfirm={() => {
            setIsOpen(false);
          }}
          failure={error != null}
          txHash={txHash as string}
        />
      </form>
    </Form>
  );
};
