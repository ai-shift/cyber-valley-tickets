import { useVerifiedShamanState } from "@/entities/verifiedshaman/model/slice";
import { useSendTx } from "@/shared/hooks";
import { revokeVerifiedShaman } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

type RemoveVerifiedShamanBtnProps = {
  shamanAddress: string;
};

export const RemoveVerifiedShamanBtn: React.FC<
  RemoveVerifiedShamanBtnProps
> = ({ shamanAddress }) => {
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const { sendTx, error, isLoading, data: txHash } = useSendTx();
  const { optimisticRemoveVerifiedShaman } = useVerifiedShamanState();

  async function deleteHandler() {
    if (!account) throw new Error("Account should be connected");
    sendTx(
      revokeVerifiedShaman(account, shamanAddress).then(() =>
        optimisticRemoveVerifiedShaman(shamanAddress),
      ),
    );
  }

  if (error != null) {
    alert("Failed to revoke verified shaman role");
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
        body={"Verified shaman role will be removed soon."}
        onConfirm={() => {
          setIsOpen(false);
        }}
        failure={error != null}
        txHash={txHash as string}
      />
    </>
  );
};
