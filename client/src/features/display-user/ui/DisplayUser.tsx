import { useEnsLookup } from "@/shared/hooks/useEnsLookup";
import { formatAddress } from "@/shared/lib/formatAddress";
import type React from "react";
import { twMerge } from "tailwind-merge";
import { useUserSocials } from "../hooks/useUserSocials";

interface DisplayUserProps {
  address: string;
  className?: string;
}

/**
 * DisplayUser - Reusable component to display user information
 *
 * Rendering priority:
 * 1. ENS name - Resolved using useEnsLookup hook
 * 2. Social handle - Fetched from backend, first available (Telegram > Instagram > Discord > WhatsApp)
 * 3. Shortened address - Link to Etherscan.io if no ENS or socials
 */
export const DisplayUser: React.FC<DisplayUserProps> = ({
  address,
  className,
}) => {
  const { data: socials, isLoading: isLoadingSocials } =
    useUserSocials(address);
  const ensName = useEnsLookup(address);

  // Priority order for social networks
  const socialPriority = ["telegram", "instagram", "discord", "whatsapp"];

  // Get first available social handle based on priority
  const getSocialDisplay = (): string | null => {
    if (!socials || socials.length === 0) return null;

    for (const network of socialPriority) {
      const social = socials.find((s) => s.network === network);
      if (social?.value) {
        return social.value;
      }
    }
    return null;
  };

  const socialDisplay = getSocialDisplay();
  const shortenedAddress = formatAddress(address as `0x${string}`);

  // Determine display value based on priority: ENS > Social > Address
  const displayValue = ensName ?? socialDisplay ?? shortenedAddress;

  // Show loading skeleton while fetching socials (ENS is usually cached)
  if (isLoadingSocials && !ensName) {
    return (
      <div className={twMerge("animate-pulse", className)}>
        <div className="h-4 w-24 bg-secondary/30 rounded" />
      </div>
    );
  }

  // If showing address (no ENS or social), make it a link to Etherscan
  if (!ensName && !socialDisplay) {
    return (
      <a
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className={twMerge("text-primary hover:underline", className)}
        title={address}
      >
        {displayValue}
      </a>
    );
  }

  return (
    <span
      className={twMerge("text-primary font-medium", className)}
      title={address}
    >
      {displayValue}
    </span>
  );
};
