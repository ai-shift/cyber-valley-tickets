import { readNotification } from "@/entities/notification";
import { queryClient } from "@/shared/api";
import { useMutation } from "@tanstack/react-query";

export const useReadNotification = () =>
  useMutation({
    mutationFn: (id: number) => readNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
