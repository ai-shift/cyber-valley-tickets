import { client, cvlandChain } from "@/shared/lib/web3/state";
import { useQuery } from "@tanstack/react-query";
import { getContract, readContract } from "thirdweb";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";

// namehash("addr.reverse") from our ENS deployment scripts.
const ADDR_REVERSE_NODE =
  "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";

function computeReverseNode(address: string): `0x${string}` {
  // Matches the Solidity logic used in ethereum/scripts/deploy-ens.js:
  // reverseNode = keccak256(ADDR_REVERSE_NODE + keccak256(utf8(lower(hex(address without 0x)))))
  const addrHex = address.slice(2).toLowerCase();
  const addrHash = keccak256(toUtf8Bytes(addrHex));
  const packed = `0x${ADDR_REVERSE_NODE.slice(2)}${addrHash.slice(2)}` as const;
  return keccak256(packed) as `0x${string}`;
}

export const useEnsLookup = (address?: string) => {
  const localResolverAddress = import.meta.env.PUBLIC_ENS_RESOLVER_ADDRESS;

  const { data } = useQuery({
    queryKey: ["ens", address, localResolverAddress],
    queryFn: async () => {
      if (!address) return null;

      // Use local ENS resolver if configured (for local testing)
      if (localResolverAddress) {
        try {
          // Directly call the resolver contract using Thirdweb
          const resolverContract = getContract({
            client,
            chain: cvlandChain,
            address: localResolverAddress as `0x${string}`,
          });

          const reverseNode = computeReverseNode(address);

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
            params: [reverseNode],
          });

          if (name && name.length > 0) {
            return name;
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
