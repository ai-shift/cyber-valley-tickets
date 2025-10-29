import { userQueries } from "@/entities/user";
import { useVerifiedShamanState } from "@/entities/verifiedshaman/model/slice";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { RemoveVerifiedShamanBtn } from "./RemoveVerifiedShamanBtn";

export const VerifiedShamansList: React.FC = () => {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery(userQueries.verifiedShamans());

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
      {uniqueAddresses.map((address) => (
        <ManageItem
          key={address}
          title={formatAddress(address as `0x${string}`)}
          render={() => [
            <RemoveVerifiedShamanBtn
              key={address}
              shamanAddress={address}
            />,
          ]}
        />
      ))}
    </ul>
  );
};
