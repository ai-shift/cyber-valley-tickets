import animationData from "@/lotties/vagina.json";
import { apiClient } from "@/shared/api";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import Lottie from "lottie-react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const POLLING_INTERVAL_MS = 2000;
const MAX_POLLING_ATTEMPTS = 60; // 2 minutes max
const SUCCESS_ANIMATION_DURATION_MS = 2500;

export const TxHashPlaceholderPage: React.FC = () => {
  const { txHash } = useParams<{ txHash: string }>();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [foundEventId, setFoundEventId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!txHash) {
      navigate("/", { replace: true });
      return;
    }

    // Normalize txHash to lowercase
    const normalizedTxHash = txHash.toLowerCase();

    const pollForEvent = async (): Promise<boolean> => {
      try {
        const response = await apiClient.GET(
          "/api/events/by-tx-hash/{tx_hash}/",
          {
            params: {
              path: {
                // @ts-ignore: T2561 - API uses snake_case in URL, types use camelCase
                tx_hash: normalizedTxHash,
              },
            },
          },
        );

        if (response.data?.id) {
          // Event found! Show success animation then navigate
          setFoundEventId(response.data.id);
          setShowSuccess(true);
          setIsPolling(false);
          // Navigate after animation duration with state to indicate we came from txhash
          setTimeout(() => {
            navigate(`/events/${response.data.id}`, {
              replace: true,
              state: { fromTxHash: true },
            });
          }, SUCCESS_ANIMATION_DURATION_MS);
          return true;
        }
      } catch (err) {
        // 404 is expected while event is being indexed
        // Other errors should be logged but polling continues
        console.log("Polling attempt failed:", err);
      }
      return false;
    };

    const intervalId = setInterval(async () => {
      if (!isPolling) {
        clearInterval(intervalId);
        return;
      }

      const found = await pollForEvent();
      if (found) {
        clearInterval(intervalId);
        return;
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLLING_ATTEMPTS) {
          clearInterval(intervalId);
          setIsPolling(false);
          setError(
            "Event is taking longer than expected to sync. Please check your events list later.",
          );
        }
        return next;
      });
    }, POLLING_INTERVAL_MS);

    // Initial check
    pollForEvent();

    return () => {
      clearInterval(intervalId);
    };
  }, [txHash, navigate, isPolling]);

  const handleCancel = () => {
    setIsPolling(false);
    navigate("/", { replace: true });
  };

  const progress = Math.min(
    Math.round((attempts / MAX_POLLING_ATTEMPTS) * 100),
    99,
  );

  // Show success animation when event is found
  if (showSuccess && foundEventId) {
    return (
      <PageContainer hasBackIcon={false} name="Success!">
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <div className="mb-4">
            <Lottie animationData={animationData} loop={false} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-primary">
            Success!
          </h1>

          <h2 className="text-xl font-semibold text-center mb-4">
            Event created successfully
          </h2>

          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Your event has been confirmed and is now available.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6 w-full max-w-md">
            <p className="text-xs text-muted-foreground mb-1">
              Transaction Hash
            </p>
            <p className="font-mono text-sm break-all">{txHash}</p>
          </div>

          <Button
            onClick={() =>
              navigate(`/events/${foundEventId}`, { replace: true })
            }
          >
            View Event
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer hasBackIcon={false} name="Processing Event">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {!error ? (
          <>
            <div className="relative mb-8">
              <Loader className="h-16 w-16 animate-[spin_3s_linear_infinite] text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{progress}%</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-center mb-4">
              Confirming your event creation...
            </h2>

            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Your transaction has been submitted and is being processed by the
              network. This usually takes a few seconds.
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 w-full max-w-md">
              <p className="text-xs text-muted-foreground mb-1">
                Transaction Hash
              </p>
              <p className="font-mono text-sm break-all">{txHash}</p>
            </div>

            <Button filling="outline" onClick={handleCancel}>
              Cancel and return home
            </Button>
          </>
        ) : (
          <>
            <div className="mb-8">
              <img
                src="/icons/price_1.svg"
                alt="Timeout"
                className="h-16 w-16 opacity-50"
              />
            </div>

            <h2 className="text-xl font-semibold text-center mb-4">
              Event still processing
            </h2>

            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>

            <div className="p-4 mb-6 w-full max-w-md">
              <p className="text-xs text-muted-foreground mb-1">
                Transaction Hash
              </p>
              <p className="font-mono text-sm break-all">{txHash}</p>
            </div>

            <div className="flex gap-3">
              <Button filling="outline" onClick={handleCancel}>
                Return home
              </Button>
              <Button onClick={() => window.location.reload()}>
                Continue waiting
              </Button>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};
