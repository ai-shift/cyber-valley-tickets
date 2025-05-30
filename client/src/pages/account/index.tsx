import { useRefreshSlice } from "@/app/providers";
import { apiClient } from "@/shared/api";
import { formatAddress } from "@/shared/lib/formatAddress";
import { mintERC20 } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
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
      <div className="flex flex-col items-center gap-10">
        <div className="my-10 flex gap-5 items-center">
          <img
            className="rounded-full h-20 aspect-square"
            src={`https://effigy.im/a/${address}.svg`}
            alt="User"
          />
          <p className="text-lg">{formatAddress(address as `0x${string}`)}</p>
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
          <Link to="/account/my-events" className="w-full block">
            <Button
              filling="outline"
              size="lg"
              className="block w-full"
              variant="secondary"
            >
              My events
            </Button>
          </Link>
          <Button variant="destructive" size="lg" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
