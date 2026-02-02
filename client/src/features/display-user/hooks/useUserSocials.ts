import { useQuery } from "@tanstack/react-query";

interface UserSocial {
  network: string;
  value: string;
}

const getUserSocials = async (address: string): Promise<UserSocial[]> => {
  // Use direct fetch since this endpoint is not yet in the auto-generated API types
  const response = await fetch(`/api/users/${address}/socials`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user socials: ${response.statusText}`);
  }

  return (await response.json()) as UserSocial[];
};

export const useUserSocials = (address?: string) => {
  return useQuery({
    queryKey: ["user", "socials", address],
    queryFn: async () => {
      if (!address) return null;
      return getUserSocials(address);
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
