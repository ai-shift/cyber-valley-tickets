import { useLocalproviderState } from "@/entities/localprovider";
import { userQueries } from "@/entities/user";
import { DisplayUser } from "@/features/display-user";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { RemoveLocalproviderBtn } from "./RemoveLocalproviderBtn";

interface LocalproviderListProps {
  searchParamName?: string;
}

export const LocalproviderList: React.FC<LocalproviderListProps> = ({
  searchParamName = "search",
}) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(searchParamName) || undefined;

  const {
    data: users,
    isLoading,
    error,
  } = useQuery(userQueries.localproviders(searchQuery));
  const { removedLocalprovider, addedLocalprovider } = useLocalproviderState();

  const addresses = users?.map((user) => user.address) ?? [];
  const uniqueAddresses = [
    ...new Set(
      [...addresses, ...addedLocalprovider].filter(
        (address) => !removedLocalprovider.includes(address),
      ),
    ),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) return <ErrorMessage errors={error} />;
  if (!users) {
    return (
      <ErrorMessage errors={new Error("Some problem with getting staff")} />
    );
  }

  if (uniqueAddresses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No local providers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto py-2">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-primary">
            <th className="py-3 px-3 text-primary font-semibold">Provider</th>
            <th className="py-3 px-3 text-primary font-semibold w-32">
              Default Share
            </th>
            <th className="py-3 px-3 text-primary font-semibold w-24 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/60">
          {uniqueAddresses.map((address) => {
            const user = users.find((entry) => entry.address === address);
            const profileManagerBps = user?.profileManagerBps ?? 0;

            return (
              <tr key={address} className="border-b border-secondary/30">
                <td className="py-3 px-3">
                  <DisplayUser address={address} />
                </td>
                <td className="py-3 px-3">
                  {profileManagerBps > 0 ? (
                    <span className="text-sm font-medium">
                      {profileManagerBps}%
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <RemoveLocalproviderBtn localproviderAddress={address} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
