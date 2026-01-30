import Lottie from "lottie-react";
import animationData from "@/lotties/vagina.json";
import { useState } from "react";
import type { Ticket } from "../model/types";
import { TicketQR } from "./TicketQR";

type TicketCardProps = {
  ticket: Ticket;
};

export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const isRedeemed = ticket.isRedeemed;
  const isPending = ticket.pendingIsRedeemed;

  return (
    <button
      type="button"
      className="perspective-1000 h-96 aspect-7/9 cursor-pointer bg-transparent border-none p-0"
      onClick={handleFlip}
      disabled={isPending}
      aria-label={isFlipped ? "Show ticket back" : "Show QR code"}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Back side - Ticket ID */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="card w-full h-full flex flex-col items-center justify-center bg-black border-primary">
            {isRedeemed ? (
              <div className="flex flex-col items-center justify-center h-full w-full p-6">
                <div className="text-secondary text-2xl font-bold tracking-[0.3em] mt-6 uppercase">
                  Success
                </div>
                <div className="text-white/90 text-lg mt-2 font-light tracking-wider">
                  Redeemed
                </div>
                <div className="mt-6 px-4 py-2 border border-secondary/30">
                  <span className="text-secondary/80 text-xs tracking-widest uppercase">
                    Ticket Active
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-primary/40">
                  <span>EVENT</span>
                  <span>{ticket.eventId}</span>
                </div>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-center justify-center h-full w-full p-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-secondary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="text-secondary text-lg font-bold tracking-wider mt-6">
                  REDEEM PENDING
                </div>
                <div className="text-primary/60 text-sm mt-2 tracking-widest text-center">
                  TRANSACTION IN PROGRESS
                </div>
                <div className="text-primary/40 text-xs mt-4 font-mono">
                  AWAITING CONFIRMATION...
                </div>
              </div>
            ) : (
              <>
                <div className="text-primary text-xs tracking-widest mb-4">
                  CYBER VALLEY
                </div>
                <div className="text-secondary text-6xl font-bold mb-2">#</div>
                <div className="text-white text-3xl font-mono tracking-wider">
                  {ticket.id}
                </div>
                <div className="text-primary/60 text-sm mt-6 tracking-widest">
                  TICKET
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-primary/40">
                  <span>EVENT</span>
                  <span>{ticket.eventId}</span>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Front side - QR Code or Lottie */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="card w-full h-full flex flex-col items-center justify-center bg-black border-primary">
            {isFlipped && isRedeemed ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <Lottie animationData={animationData} loop={true} className="w-full h-full" />
              </div>
            ) : (
              <>
                <div className="bg-black p-4 rounded-lg">
                  <TicketQR ticket={ticket} />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-primary/40">
                  <span>ID</span>
                  <span>{ticket.id}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
