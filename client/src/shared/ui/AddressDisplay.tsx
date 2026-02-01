import type { Socials } from "@/entities/user";
import type { components } from "@/shared/api";
import { useEnsLookup } from "@/shared/hooks/useEnsLookup";
import { formatAddress } from "@/shared/lib/formatAddress";
import type React from "react";

type UploadSocials = components["schemas"]["UploadSocials"];

type AddressDisplayProps = {
  address: string;
  socials?: Socials[] | Socials | UploadSocials | null;
  className?: string;
  showFullAddressInTooltip?: boolean;
};

const getInstagramHandle = (
  socials?: Socials[] | Socials | UploadSocials | null,
) => {
  if (!socials) return null;
  if (Array.isArray(socials)) {
    const instagramSocial = socials.find(
      (social) => social.network === "instagram",
    );
    return instagramSocial?.value ?? null;
  }
  return socials.network === "instagram" ? socials.value : null;
};

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  socials,
  className,
  showFullAddressInTooltip = true,
}) => {
  const instagramHandle = getInstagramHandle(socials);
  const ensName = useEnsLookup(instagramHandle ? undefined : address);
  const displayValue =
    instagramHandle ?? ensName ?? formatAddress(address as `0x${string}`);

  return (
    <span
      className={className}
      title={showFullAddressInTooltip ? address : undefined}
    >
      {displayValue}
    </span>
  );
};
