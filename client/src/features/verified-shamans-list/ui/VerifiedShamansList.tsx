import { userQueries } from "@/entities/user";
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

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!users)
    return (
      <ErrorMessage
        errors={new Error("Some problem with getting verified shamans")}
      />
    );

  return (
    <ul className="divide-y divide-secondary/60 py-2">
      {users.map((user) => (
        <ManageItem
          key={user.address}
          title={formatAddress(user.address as `0x${string}`)}
          render={() => [
            <RemoveVerifiedShamanBtn
              key={user.address}
              shamanAddress={user.address}
            />,
          ]}
        />
      ))}
    </ul>
  );
};
