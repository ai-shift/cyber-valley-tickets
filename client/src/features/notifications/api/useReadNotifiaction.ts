import { readNotification } from "@/entities/notification";
import { useMutation } from "@tanstack/react-query";

export const useReadNotification = () =>
  useMutation({
    mutationFn: (id: number) => readNotification(id),
  });
