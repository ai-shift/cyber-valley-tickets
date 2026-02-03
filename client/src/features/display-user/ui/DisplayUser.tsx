import { useEnsLookup } from "@/shared/hooks/useEnsLookup";
import { formatAddress } from "@/shared/lib/formatAddress";
import type React from "react";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router";

interface DisplayUserProps {
  address: string;
  className?: string;
  navigateOnClick?: boolean;
}

/**
 * DisplayUser - Reusable component to display user information
 *
 * Rendering priority:
 * 1. ENS name - Resolved using useEnsLookup hook
 * 2. Shortened address - Link to Etherscan.io if no ENS
 *
 * Clicking on the component navigates to the user's profile page (if navigateOnClick is true)
 */
export const DisplayUser: React.FC<DisplayUserProps> = ({
  address,
  className,
  navigateOnClick = true,
}) => {
  const navigate = useNavigate();
  const ensName = useEnsLookup(address);

  const handleClick = (e: React.MouseEvent) => {
    if (navigateOnClick) {
      e.stopPropagation();
      navigate(`/user/${address}`);
    }
  };

  const shortenedAddress = formatAddress(address as `0x${string}`);

  // Determine display value: ENS > Address
  const displayValue = ensName ?? shortenedAddress;

  const clickableClasses = navigateOnClick
    ? "cursor-pointer hover:underline"
    : "";

  // If no ENS, show shortened address with click handler
  if (!ensName) {
    if (navigateOnClick) {
      return (
        <span
          onClick={handleClick}
          className={twMerge(
            "text-secondary hover:underline cursor-pointer",
            className
          )}
          title={`${address} (click to view profile)`}
        >
          {displayValue}
        </span>
      );
    }
    return (
      <a
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className={twMerge("text-secondary hover:underline", className)}
        title={address}
      >
        {displayValue}
      </a>
    );
  }

  return (
    <span
      onClick={handleClick}
      className={twMerge(
        "text-secondary font-medium",
        clickableClasses,
        className
      )}
      title={`${address} (click to view profile)`}
    >
      {displayValue}
    </span>
  );
};
