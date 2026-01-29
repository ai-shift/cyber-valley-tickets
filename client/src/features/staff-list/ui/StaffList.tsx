import { useStaffState } from "@/entities/staff";
import { userQueries } from "@/entities/user";
import { formatAddress } from "@/shared/lib/formatAddress";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { RemoveStaffBtn } from "./RemoveStaffBtn";

interface StaffListProps {
  searchQuery?: string;
}

export const StaffList: React.FC<StaffListProps> = ({ searchQuery }) => {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery(userQueries.staff(searchQuery));
  const { removedStaff, addedStaff } = useStaffState();

  const addresses = users?.map((user) => user.address) ?? [];
  const uniqueAddresses = [
    ...new Set(
      [...addresses, ...addedStaff].filter(
        (address) => !removedStaff.includes(address),
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
            <RemoveStaffBtn key={address} staffAddress={address} />,
          ]}
        />
      ))}
    </ul>
  );
};
