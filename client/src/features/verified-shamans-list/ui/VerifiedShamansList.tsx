import { userQueries } from "@/entities/user";
import { useVerifiedShamanState } from "@/entities/verifiedshaman/model/slice";
import { AddressDisplay } from "@/shared/ui/AddressDisplay";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { RemoveVerifiedShamanBtn } from "./RemoveVerifiedShamanBtn";

interface VerifiedShamansListProps {
  searchParamName?: string;
}

export const VerifiedShamansList: React.FC<VerifiedShamansListProps> = ({
  searchParamName = "search",
}) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(searchParamName) || undefined;

  const {
    data: users,
    isLoading,
    error,
  } = useQuery(userQueries.verifiedShamans(searchQuery));

  const { removedVerifiedShaman, addedVerifiedShaman } =
    useVerifiedShamanState();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!users)
    return (
      <ErrorMessage
        errors={new Error("Some problem with getting verified shamans")}
      />
    );

  const addresses = users.map((user) => user.address);
  const uniqueAddresses = [
    ...new Set(
      [...addresses, ...addedVerifiedShaman].filter(
        (address) => !removedVerifiedShaman.includes(address),
      ),
    ),
  ];

  return (
    <ul className="divide-y divide-secondary/60 py-2">
      {uniqueAddresses.map((address) => {
        const user = users.find((entry) => entry.address === address);
        return (
        <ManageItem
          key={address}
          title={
            <AddressDisplay
              address={address}
              socials={user?.socials}
              showFullAddressInTooltip
            />
          }
          render={() => [
            <RemoveVerifiedShamanBtn key={address} shamanAddress={address} />,
          ]}
        />
        );
      })}
    </ul>
  );
};
