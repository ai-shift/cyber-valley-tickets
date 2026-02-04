import { useState } from "react";
import { useNavigate } from "react-router";

import { createDistributionProfile } from "@/shared/lib/web3";

import { PageContainer } from "@/shared/ui/PageContainer";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
// @ts-expect-error Loader is used in JSX but TS doesn't detect it through conditional
import { AlertCircle, Loader, Plus, Trash2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { isAddress } from "thirdweb/utils";

const BASIS_POINTS = 10000;

interface Recipient {
  id: string;
  address: string;
  share: string;
}

function getDuplicateAddresses(recipients: Recipient[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const r of recipients) {
    if (!r.address) continue;
    const normalized = r.address.toLowerCase();
    if (seen.has(normalized)) {
      duplicates.add(normalized);
    } else {
      seen.add(normalized);
    }
  }
  return duplicates;
}

export const CreateDistributionProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: crypto.randomUUID(),
      address: account?.address || "",
      share: "10000",
    },
  ]);

  const totalShares = recipients.reduce(
    (sum, r) => sum + (Number.parseInt(r.share) || 0),
    0,
  );
  const remainingShares = BASIS_POINTS - totalShares;

  function addRecipient() {
    setRecipients([
      ...recipients,
      {
        id: crypto.randomUUID(),
        address: "",
        share: "0",
      },
    ]);
  }

  function removeRecipient(id: string) {
    if (recipients.length <= 1) {
      return; // Keep at least one recipient
    }
    setRecipients(recipients.filter((r) => r.id !== id));
  }

  function updateRecipient(
    id: string,
    field: "address" | "share",
    value: string,
  ) {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function validateForm(): string | null {
    if (recipients.length === 0) {
      return "At least one recipient is required";
    }

    const addresses = new Set<string>();

    for (const recipient of recipients) {
      if (!recipient.address.trim()) {
        return "All recipients must have an address";
      }
      if (!isAddress(recipient.address)) {
        return `Invalid address: ${recipient.address}`;
      }
      const normalizedAddress = recipient.address.toLowerCase();
      if (addresses.has(normalizedAddress)) {
        return `Duplicate address: ${recipient.address}`;
      }
      addresses.add(normalizedAddress);
      const share = Number.parseInt(recipient.share);
      if (Number.isNaN(share) || share <= 0) {
        return "All shares must be positive numbers";
      }
    }

    if (totalShares !== BASIS_POINTS) {
      return `Total shares must equal 10000 (currently ${totalShares})`;
    }

    return null;
  }

  // @ts-expect-error Used in JSX but TS doesn't detect it through conditional return
  async function handleSubmit() {
    if (!account) {
      setSubmitError("Please connect your wallet");
      return;
    }

    const error = validateForm();
    if (error) {
      setSubmitError(error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const addresses = recipients.map((r) => r.address);
      const shares = recipients.map((r) => Number.parseInt(r.share));

      await createDistributionProfile(account, addresses, shares);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to create distribution profile:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      setSubmitError(`Transaction failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!account) {
    return (
      <PageContainer name="Create Distribution Profile">
        <div className="flex justify-center py-10">
          <p className="text-lg text-muted-foreground">
            Please connect your wallet to create a distribution profile
          </p>
        </div>
      </PageContainer>
    );
  }

  const validationError = validateForm();
  const duplicateAddresses = getDuplicateAddresses(recipients);

  return (
    <PageContainer name="Create Distribution Profile">
      <div className="px-5 py-4 max-w-2xl mx-auto">
        {/* Info Section */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Distribution Profile</strong> defines how the 80% flexible
            revenue share is distributed among recipients.
          </p>
          <p className="text-sm text-muted-foreground">
            Platform fees are fixed: CyberiaDAO (10%) + CVE PT PMA (5%).
          </p>
        </div>

        {/* Recipients List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recipients</h3>
            <span
              className={`text-sm font-medium ${
                totalShares === BASIS_POINTS
                  ? "text-green-500"
                  : "text-amber-500"
              }`}
            >
              Total: {totalShares} / {BASIS_POINTS}
            </span>
          </div>

          {recipients.map((recipient) => {
            const isDuplicate =
              recipient.address &&
              duplicateAddresses.has(recipient.address.toLowerCase());

            return (
              <div key={recipient.id} className="flex items-start gap-3 pb-6">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={recipient.address}
                    onChange={(e) =>
                      updateRecipient(recipient.id, "address", e.target.value)
                    }
                    disabled={isSubmitting}
                    className={`font-mono text-sm ${
                      isDuplicate
                        ? "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                  {isDuplicate && (
                    <p className="absolute -bottom-5 left-0 text-xs text-destructive whitespace-nowrap">
                      Duplicate address
                    </p>
                  )}
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    max={BASIS_POINTS}
                    placeholder="0"
                    value={recipient.share}
                    onChange={(e) =>
                      updateRecipient(recipient.id, "share", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeRecipient(recipient.id)}
                  disabled={recipients.length <= 1 || isSubmitting}
                  className="h-12 w-12 shrink-0"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add Recipient Button */}
        <Button
          variant="secondary"
          onClick={addRecipient}
          disabled={isSubmitting}
          className="w-full mt-4"
        >
          <Plus size={18} className="mr-2" />
          Add Recipient
        </Button>

        {/* Shares Summary */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Remaining to allocate:
            </span>
            <span
              className={`font-semibold ${
                remainingShares === 0 ? "text-green-500" : "text-amber-500"
              }`}
            >
              {remainingShares > 0 ? `+${remainingShares}` : remainingShares} bp
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            10000 basis points = 100%
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
            <AlertCircle
              className="text-destructive shrink-0 mt-0.5"
              size={18}
            />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        {/* Success Dialog */}
        <ResultDialog
          open={showSuccessDialog}
          setOpen={setShowSuccessDialog}
          title="Distribution Profile Created"
          body="Your distribution profile has been created successfully. It will be available for use when approving events."
          onConfirm={() => navigate(-1)}
        />

        {/* Submit Button -->
        <div className="mt-8 flex gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!!validationError || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Profile"
            )}
          </Button>
        </div>

        {/* Validation Hint */}
        {validationError && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {validationError}
          </p>
        )}
      </div>
    </PageContainer>
  );
};
