import { useLocalproviderState } from "@/entities/localprovider";
import { userQueries } from "@/entities/user";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { RemoveLocalproviderBtn } from "./RemoveLocalproviderBtn";

interface LocalproviderListProps {
  searchQuery?: string;
}

export const LocalproviderList: React.FC<LocalproviderListProps> = ({
  searchQuery,
}) => {
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

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!users)
    return (
      <ErrorMessage errors={new Error("Some problem with getting staff")} />
    );

  return (
    <ul className="divide-y divide-secondary/60 py-2">
      {uniqueAddresses.map((address) => (
        <ManageItem
          key={address}
          title={formatAddress(address as `0x${string}`)}
          render={() => [
            <RemoveLocalproviderBtn
              key={address}
              localproviderAddress={address}
            />,
          ]}
        />
      ))}
    </ul>
  );
};
