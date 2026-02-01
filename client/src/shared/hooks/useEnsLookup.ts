import { client, cvlandChain } from "@/shared/lib/web3/state";
import { useQuery } from "@tanstack/react-query";
import { getContract, readContract } from "thirdweb";

// Pre-computed reverse nodes for local testing addresses
// These match the Solidity sha3HexAddress computation
const LOCAL_REVERSE_NODES: Record<string, string> = {
  // master.eth / deployer
  "0x2789023f36933e208675889869c7d3914a422921":
    "0x700198ca3dd453dc70cfee8fa4429648541910576f896bcdf7589084b348ee88",
  // creator.eth / alice.eth
  "0x96e37a0cd915c38de8b5aac0db61eb7eb839ceeb":
    "0x785c22c24e54fd6556b8cf44c11d1e6a81c7ac35d5e6894aba5527f67ac23368",
  // customer1.eth / bob.eth
  "0xa84036a18ecd8f4f3d21ca7f85becc033571b15e":
    "0x68d954abf78150e53cd74c6ac8e708a45784b49a3d463096050b3aa453320bf8",
  // verifiedshaman.eth / charlie.eth
  "0x7617b92b06c4ce513c53df1c818ed25f95475f69":
    "0x6a2e49923bb21d010dbf6ad8334c95802b336ea59a65bd347cb295ab4f4f5bbb",
  // localprovider.eth
  "0x9772d9a6a104c162b97767e6a654be54370a042f":
    "0x7db1415b0ac38586c0ccd1eb470f2204a72b7232040d298fccae2ce14460cfa8",
  // backend.eth
  "0xed7f6ca6e91aa3ff2c3918b5caf02ff449ab3a4":
    "0xa41932e5022cf8c786eccf5270d35e27a761afdad44d4641fdd367142ba47e84",
};

export const useEnsLookup = (address?: string) => {
  const localResolverAddress = import.meta.env.PUBLIC_ENS_RESOLVER_ADDRESS;

  const { data } = useQuery({
    queryKey: ["ens", address, localResolverAddress],
    queryFn: async () => {
      if (!address) return null;

      // Use local ENS resolver if configured (for local testing)
      if (localResolverAddress) {
        try {
          const normalizedAddress = address.toLowerCase();

          // Check if we have a pre-computed reverse node for this address
          const reverseNode = LOCAL_REVERSE_NODES[normalizedAddress];

          if (reverseNode) {
            // Directly call the resolver contract using Thirdweb
            const resolverContract = getContract({
              client,
              chain: cvlandChain,
              address: localResolverAddress as `0x${string}`,
            });

            // Call name() on the resolver with the reverse node
            const name = await readContract({
              contract: resolverContract,
              method: {
                type: "function",
                name: "name",
                inputs: [{ type: "bytes32", name: "node" }],
                outputs: [{ type: "string" }],
                stateMutability: "view",
              },
              params: [reverseNode as `0x${string}`],
            });

            if (name && name.length > 0) {
              return name;
            }
          }
        } catch (error) {
          console.warn(
            "Local ENS resolution failed, falling back to mainnet:",
            error,
          );
        }
      }

      // Fall back to default mainnet resolution
      const { resolveName: defaultResolve } = await import(
        "thirdweb/extensions/ens"
      );
      return defaultResolve({
        client,
        address: address as `0x${string}`,
      });
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return data;
};
