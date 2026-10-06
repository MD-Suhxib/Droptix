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

        const { data, error } = await supabase.rpc("cancel_ticket", {
            p_ticket_id: ticketId,
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

        return NextResponse.json({
            success: true,
            cancellation: data?.[0] ?? null,
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