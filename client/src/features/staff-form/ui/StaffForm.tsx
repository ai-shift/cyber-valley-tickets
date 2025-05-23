import { assignStaff } from "@/shared/lib/web3";
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
  const account = useActiveAccount();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    (async () => {
      if (!account) throw new Error("Account should be connected");
      await assignStaff(account, values.address);
    })();
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
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  );
};
