import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { ticketId } = body;

        if (!ticketId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ticketId is required",
                },
                { status: 400 }
            );
        }

        const numericTicketId = Number(ticketId);
        if (!numericTicketId || isNaN(numericTicketId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Valid numeric ticketId is required",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.rpc("cancel_ticket", {
            p_ticket_id: numericTicketId,
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

        const cancellationData = Array.isArray(data) ? data[0] : (data ?? null);

        return NextResponse.json({
            success: true,
            cancellation: cancellationData,
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