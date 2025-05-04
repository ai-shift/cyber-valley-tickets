import { readNotification } from "@/entities/notification";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/api";

export const useReadNotification = () =>
  useMutation({
    mutationFn: (id: string) => readNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
