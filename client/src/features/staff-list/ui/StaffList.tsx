import { userQueries } from "@/entities/user";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";

export const StaffList: React.FC = () => {
  const { data: users, isLoading, error } = useQuery(userQueries.staff());

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!users)
    return (
      <ErrorMessage errors={new Error("Some problem with getting staff")} />
    );

  return (
    <ul className="flex flex-col gap-3 py-5">
      {users.map((user) => (
        <ManageItem
          key={user.address}
          title={user.address}
          render={() => [<p key={user.address}>Допа</p>]}
        />
      ))}
    </ul>
  );
};
