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

  return (
    <button
      type="button"
      className="h-96 aspect-7/9 cursor-pointer bg-transparent border-none p-0"
      onClick={handleFlip}
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
          </div>
        </div>

        {/* Front side - QR Code */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="card w-full h-full flex flex-col items-center justify-center bg-black border-primary">
            <div className="bg-black p-4 rounded-lg">
              <TicketQR ticket={ticket} />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-primary/40">
              <span>ID</span>
              <span>{ticket.id}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
