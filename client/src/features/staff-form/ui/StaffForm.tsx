import { useStaffState } from "@/entities/staff";
import { useSendTx } from "@/shared/hooks";
import { assignStaff } from "@/shared/lib/web3";
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

export const StaffForm: React.FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const account = useActiveAccount();
  const { sendTx, error, isLoading } = useSendTx();
  const { optimisticAddStaff } = useStaffState();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (account == null) {
      throw new Error("Account isn't connected");
    }
    sendTx(
      assignStaff(account, values.address).then(() => {
        setIsOpen(true);
        optimisticAddStaff(values.address);
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
              <FormLabel>Staff address</FormLabel>
              <FormControl>
                <Input placeholder="Enter string starting with 0x" {...field} />
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
          body="Staff role will be granted soon"
          onConfirm={() => {
            setIsOpen(false);
          }}
          failure={error != null}
        />
      </form>
    </Form>
  );
};
