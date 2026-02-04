import { useEnsLookup } from "@/shared/hooks/useEnsLookup";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useParams } from "react-router";

interface UserProfile {
  address: string;
  ens: string | null;
  avatar_url: string;
  socials: Array<{ network: string; value: string }>;
  roles: string[];
}

const fetchUserProfile = async (address: string): Promise<UserProfile> => {
  const response = await fetch(`/api/users/${address}/profile`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
};

const useUserProfile = (address: string | undefined) => {
  return useQuery({
    queryKey: ["user", "profile", address],
    queryFn: () => {
      if (!address) throw new Error("No address provided");
      return fetchUserProfile(address);
    },
    enabled: !!address,
  });
};

export const UserPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { data: profile, error, isLoading } = useUserProfile(address);
  const ensName = useEnsLookup(address || "");

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!profile) return <ErrorMessage errors="User not found" />;

  const displayName =
    ensName || formatAddress(profile.address as `0x${string}`);

  return (
    <PageContainer name="User Profile">
      <div className="flex flex-col gap-6 p-4">
        {/* Avatar and main info */}
        <div className="flex flex-col items-center gap-4">
          <img
            src={`https://effigy.im/a/${profile.address}.svg`}
            alt="User avatar"
            className="w-24 h-24 rounded-full"
          />
          <div className="text-center">
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <a
              href={`https://etherscan.io/address/${profile.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-secondary hover:underline"
            >
              {formatAddress(profile.address as `0x${string}`)}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {/* Roles */}
          {profile.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-sm bg-secondary/20 rounded-full capitalize"
                >
                  {role.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Socials */}
        {profile.socials && profile.socials.length > 0 && (
          <div className="border-t border-secondary/20 pt-4">
            <h3 className="text-lg font-semibold mb-3">Socials</h3>
            <div className="flex flex-col gap-2">
              {profile.socials.map((social) => (
                <div
                  key={social.network}
                  className="flex justify-between items-center py-2 px-3 bg-secondary/10 rounded"
                >
                  <span className="capitalize font-medium">
                    {social.network}
                  </span>
                  <span className="text-secondary">{social.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
