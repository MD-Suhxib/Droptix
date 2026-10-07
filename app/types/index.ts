export interface QueueStatusResponse {
  success: boolean;
  queue?: {
    waitlist_id: number;
    queue_position: number;
    status: "WAITING" | "OFFERED" | "COMPLETED" | "CANCELLED";
  };
  error?: string;
}

export interface JoinQueueResponse {
  success: boolean;
  queue?: {
    id: number;
    event_id: number;
    user_id: string;
    position: number;
    status: string;
    created_at: string;
  };
  error?: string;
}

export interface SeatHoldResponse {
  success: boolean;
  hold?: {
    id: number;
    seat_id: number;
    user_id: string;
    expires_at: string;
    status: string;
  };
  error?: string;
}

export interface PaymentCreateResponse {
  success: boolean;
  paymentStatus?: "PAID" | "FAILED" | "PENDING";
  providerPaymentId?: string;
  webhook?: {
    success: boolean;
    payment?: {
      id: number;
      ticket_id: number;
      provider_payment_id: string;
      amount: number;
      status: string;
    };
    error?: string;
  };
  duplicateCallback?: {
    success: boolean;
    payment?: {
      id: number;
      ticket_id: number;
      provider_payment_id: string;
      amount: number;
      status: string;
    };
    error?: string;
  };
  error?: string;
}

export interface TicketCancelResponse {
  success: boolean;
  cancellation?: {
    ticket?: {
      id: number;
      status: string;
    };
    hold_created?: boolean;
    promoted_user_id?: string;
    message?: string;
  };
  error?: string;
}

export interface SeatItem {
  id: number;
  seatNumber: string;
  status: "AVAILABLE" | "HELD" | "SOLD" | "SELECTED";
  price: number;
}

export type Step = "landing" | "queue" | "seats" | "checkout" | "confirmation";

export interface BookingState {
  userId: string;
  eventId: number;
  queuePosition?: number;
  selectedSeatId?: number;
  selectedSeatNumber?: string;
  holdId?: number;
  expiresAt?: string;
  ticketId?: number;
  providerPaymentId?: string;
  amount?: number;
}
