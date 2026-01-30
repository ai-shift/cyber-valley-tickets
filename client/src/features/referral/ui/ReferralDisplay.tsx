interface ReferralDisplayProps {
  address: string;
  onClear?: () => void;
  showLabel?: boolean;
}

export const ReferralDisplay: React.FC<ReferralDisplayProps> = ({
  address,
  onClear,
  showLabel = true,
}) => {
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/30">
      <div className="flex flex-col">
        {showLabel && (
          <span className="text-xs text-muted-foreground">Referred by</span>
        )}
        <span className="text-sm font-mono text-primary" title={address}>
          {truncatedAddress}
        </span>
      </div>
      {onClear && (
        <button className="h-8 cursor-pointer" type="button" onClick={onClear}>
          <img
            className="h-full"
            src="/icons/staff bin_2.svg"
            alt="edit_button"
          />
        </button>
      )}
    </div>
  );
};
