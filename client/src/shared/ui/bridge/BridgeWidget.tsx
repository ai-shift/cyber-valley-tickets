import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useEffect, useState } from "react";

// Type definitions for Thirdweb Bridge Widget
interface BridgeQuote {
  id?: string;
  amount?: string;
  token?: string;
  chainId?: number;
}

interface WindowWithBridge extends Window {
  BridgeWidget?: {
    render: (container: HTMLElement, options: BridgeWidgetOptions) => void;
  };
}

interface BridgeWidgetOptions {
  clientId: string;
  theme: "dark" | "light";
  currency: string;
  showThirdwebBranding: boolean;
  buy: {
    chainId: number;
    tokenAddress: string;
    amount: string;
    buttonLabel: string;
    country: string;
    presetOptions: [number, number, number];
    onSuccess: (quote: BridgeQuote) => void;
    onError: (error: Error, quote: BridgeQuote | undefined) => void;
    onCancel: (quote: BridgeQuote | undefined) => void;
  };
  swap: {
    prefill: {
      buyToken: {
        chainId: number;
        tokenAddress: string;
      };
    };
    onSuccess: (quote: BridgeQuote) => void;
    onError: (error: Error, quote: BridgeQuote | undefined) => void;
    onCancel: (quote: BridgeQuote | undefined) => void;
  };
}

// Get the client ID from environment
const getClientId = () => {
  return import.meta.env.PUBLIC_THIRDWEB_PUBLIC_CLIENT_ID;
};

export const BridgeWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (typeof (window as WindowWithBridge).BridgeWidget !== "undefined") {
      setScriptLoaded(true);
      return;
    }

    // Dynamically load the bridge widget script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/thirdweb/dist/scripts/bridge-widget.js";
    script.async = true;
    script.onload = () => {
      console.log("Bridge Widget script loaded");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Bridge Widget script");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeBridgeWidget = () => {
    if (!scriptLoaded) {
      alert(
        "Bridge functionality is still loading. Please try again in a moment.",
      );
      return;
    }

    // Create bridge widget container
    const container = document.getElementById("bridge-widget-container");
    if (!container) return;

    // Clear any existing content
    container.innerHTML = "";

    // Initialize the bridge widget with USDT and IDR settings
    const bridgeWindow = window as WindowWithBridge;
    if (
      typeof bridgeWindow.BridgeWidget !== "undefined" &&
      bridgeWindow.BridgeWidget
    ) {
      bridgeWindow.BridgeWidget.render(container, {
        clientId: getClientId(),
        theme: "dark",
        currency: "IDR",
        showThirdwebBranding: true,
        buy: {
          chainId: 1, // Ethereum mainnet for USDT
          tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT address
          amount: "10",
          buttonLabel: "Buy USDT with IDR",
          country: "US", // Indonesia
          presetOptions: [10, 25, 50] as [number, number, number],
          onSuccess: (quote: BridgeQuote) => {
            console.log("Bridge purchase successful:", quote);
            alert("Purchase successful! USDT has been purchased.");
            setIsOpen(false);
          },
          onError: (error: Error, _quote: BridgeQuote | undefined) => {
            console.error("Bridge purchase error:", error);
            alert(`Purchase failed: ${error.message}`);
          },
          onCancel: (_quote: BridgeQuote | undefined) => {
            console.log("Bridge purchase cancelled");
          },
        },
        swap: {
          prefill: {
            buyToken: {
              chainId: 1,
              tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            },
          },
          onSuccess: (quote: BridgeQuote) => {
            console.log("Swap successful:", quote);
            alert("Swap successful!");
          },
          onError: (error: Error, _quote: BridgeQuote | undefined) => {
            console.error("Swap error:", error);
            alert(`Swap failed: ${error.message}`);
          },
          onCancel: (_quote: BridgeQuote | undefined) => {
            console.log("Swap cancelled");
          },
        },
      });
    } else {
      console.error(
        "BridgeWidget is not loaded. Make sure the script is included.",
      );
      alert("Bridge functionality is not available. Please try again later.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Small delay to ensure dialog is rendered
      setTimeout(initializeBridgeWidget, 100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button filling="outline" className="mt-4">
          Buy USDT with IDR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buy USDT with Indonesian Rupiah</DialogTitle>
        </DialogHeader>
        <div
          id="bridge-widget-container"
          className="min-h-[400px] w-full flex items-center justify-center"
        >
          {!scriptLoaded && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading bridge widget...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
