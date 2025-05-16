import { removeStaff } from "@/shared/lib/web3";
import { useActiveAccount } from "thirdweb/react";

type RemoveStaffIconProps = {
  staffAdress: string;
};

export const RemoveStaffIcon: React.FC<RemoveStaffIconProps> = ({
  staffAdress,
}) => {
  const account = useActiveAccount();

  async function deleteHandler() {
    if (!account) throw new Error("Account should be connected");
    await removeStaff(account, staffAdress);
  }

  return (
    <button
      className="h-full cursor-pointer"
      type="button"
      onClick={deleteHandler}
    >
      <img className="h-full" src="/icons/staff bin_2.svg" alt="edit_button" />
    </button>
  );
};
