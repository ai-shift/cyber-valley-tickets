import { readNotification } from "@/entities/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useReadNotification = (id: number) => {
  const queryClient = useQueryClient();
  const mutate = useMutation({
    mutationFn: () => readNotification(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["notifications", "list"] });
    },
  });

  return mutate;
};
