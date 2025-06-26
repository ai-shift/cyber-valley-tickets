import { useRefreshSlice } from "@/app/providers";
import { apiClient } from "@/shared/api";
import { formatAddress } from "@/shared/lib/formatAddress";
import { mintERC20 } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import { LogOut } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

export const AccountPage: React.FC = () => {
  const { setHasJWT } = useRefreshSlice();
  const account = useActiveAccount();

  const logout = async () => {
    if (!confirm("Logout?")) {
      return;
    }
    await apiClient.GET("/api/auth/logout");
    setHasJWT(false);
  };

  if (!account) return <Loader />;
  const address = account.address;

  return (
    <PageContainer hasBackIcon={false} name="Account">
      <div className="flex flex-col items-center">
        <div className="flex self-stretch gap-5 items-center py-5 px-10 sm:px-20">
          <div className="flex md:flex-row md:gap-3 flex-col items-center">
            <img
              className="rounded-full h-14 md:h-20 aspect-square"
              src={`https://effigy.im/a/${address}.svg`}
              alt="User"
            />
            <p className="text-lg">{formatAddress(address as `0x${string}`)}</p>
          </div>
          <Button
            className="ml-auto"
            variant="destructive"
            size="lg"
            onClick={logout}
          >
            <LogOut />
          </Button>
        </div>
        <div className="w-1/2 h-full flex flex-col justify-between gap-20">
          <Button
            className="mt-8"
            onClick={() =>
              mintERC20(account, 50n)
                .then(() => alert("Minted 50 tokens"))
                .catch(console.error)
            }
          >
            Mint ERC20
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
