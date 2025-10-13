import { useLocalproviderState } from "@/entities/localprovider";
import { useSendTx } from "@/shared/hooks";
import { removeRevokeLocalProvider } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

type RemoveLocalproviderBtnProps = {
  localproviderAddress: string;
};

export const RemoveLocalproviderBtn: React.FC<RemoveLocalproviderBtnProps> = ({
  localproviderAddress,
}) => {
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const { sendTx, error, isLoading, data: txHash } = useSendTx();
  const { optimisticRemoveLocalprovider } = useLocalproviderState();
  async function deleteHandler() {
    if (!account) throw new Error("Account should be connected");
    sendTx(
      removeRevokeLocalProvider(account, localproviderAddress).then(() =>
        optimisticRemoveLocalprovider(localproviderAddress),
      ),
    );
  }
  if (error != null) {
    alert("Failed to revoke staff role");
  }
  return (
    <>
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
      <ResultDialog
        open={isOpen}
        setOpen={setIsOpen}
        title="Transaction sent!"
        body={"Localprovider role will be removed soon."}
        onConfirm={() => {
          setIsOpen(false);
        }}
        failure={error != null}
        txHash={txHash as string}
      />
    </>
  );
};
