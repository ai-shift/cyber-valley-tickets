import { useStaffState } from "@/entities/staff";
import { useSendTx } from "@/shared/hooks";
import { removeStaff } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { useActiveAccount } from "thirdweb/react";

type RemoveStaffIconProps = {
  staffAddress: string;
};

// TODO: Rename, it's a button, not a simple icon
export const RemoveStaffIcon: React.FC<RemoveStaffIconProps> = ({
  staffAddress,
}) => {
  const account = useActiveAccount();
  const { sendTx, error, isLoading } = useSendTx();
  const { optimisticRemoveStaff } = useStaffState();
  async function deleteHandler() {
    if (!account) throw new Error("Account should be connected");
    sendTx(
      removeStaff(account, staffAddress).then(() =>
        optimisticRemoveStaff(staffAddress),
      ),
    );
  }
  if (error != null) {
    alert("Failed to revoke staff role");
  }
  return (
    <button
      className="h-full cursor-pointer"
      type="button"
      onClick={deleteHandler}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <img
          className="h-full"
          src="/icons/staff bin_2.svg"
          alt="edit_button"
        />
      )}
    </button>
  );
};
