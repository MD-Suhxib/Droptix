import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            holdId,
            providerPaymentId,
            amount,
            status,
        } = body;

        if (!holdId || !providerPaymentId || !amount || !status) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "holdId, providerPaymentId, amount and status are required",
                },
                { status: 400 }
            );
        }

        if (status === "FAILED") {
            return NextResponse.json({
                success: true,
                message: "Payment failed",
            });
        }

        if (status !== "PAID") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid payment status",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.rpc("confirm_payment", {
            p_hold_id: holdId,
            p_provider_payment_id: providerPaymentId,
            p_amount: amount,
        });

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 400 }
            );
        }

        const paymentRecord =
            (Array.isArray(data) ? data[0] : (data ?? {})) || {};

        let ticketId =
            paymentRecord.ticket_id ??
            paymentRecord.ticketId ??
            paymentRecord.ticket?.id ??
            paymentRecord.id;

        // If ticket_id is not directly in RPC return data, query payments table by provider_payment_id
        if (!ticketId && providerPaymentId) {
            const { data: paymentRow } = await supabase
                .from("payments")
                .select("ticket_id")
                .eq("provider_payment_id", providerPaymentId)
                .maybeSingle();

            if (paymentRow?.ticket_id) {
                ticketId = paymentRow.ticket_id;
            }
        }

        // Fallback: query tickets table by seat_id from the hold
        if (!ticketId && holdId) {
            const { data: holdRow } = await supabase
                .from("holds")
                .select("seat_id")
                .eq("id", holdId)
                .maybeSingle();

            if (holdRow?.seat_id) {
                const { data: ticketRow } = await supabase
                    .from("tickets")
                    .select("id")
                    .eq("seat_id", holdRow.seat_id)
                    .eq("status", "CONFIRMED")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (ticketRow?.id) {
                    ticketId = ticketRow.id;
                }
            }
        }

        return NextResponse.json({
            success: true,
            payment: {
                ...paymentRecord,
                ticket_id: ticketId ?? paymentRecord.ticket_id,
            },
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "Invalid request",
            },
            { status: 400 }
        );
    }
}