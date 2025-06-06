import { useStaffState } from "@/entities/staff";
import { userQueries } from "@/entities/user";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { RemoveStaffIcon } from "./RemoveStaffIcon";

export const StaffList: React.FC = () => {
  const { data: users, isLoading, error } = useQuery(userQueries.staff());
  const { removedStaff } = useStaffState();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!users)
    return (
      <ErrorMessage errors={new Error("Some problem with getting staff")} />
    );

  return (
    <ul className="divide-y divide-secondary/60 py-2">
      {users
        .filter((user) => !removedStaff.includes(user.address))
        .map((user) => (
          <ManageItem
            key={user.address}
            title={formatAddress(user.address as `0x${string}`)}
            render={() => [
              <RemoveStaffIcon
                key={user.address}
                staffAddress={user.address}
              />,
            ]}
          />
        ))}
    </ul>
  );
};
