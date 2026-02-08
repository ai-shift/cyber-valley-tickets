import { readAllNotifications } from "@/entities/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient();
  const mutate = useMutation({
    mutationFn: () => readAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });

  return mutate;
};
