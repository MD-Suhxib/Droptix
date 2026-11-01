import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { password, eventId } = body;

        if (password !== "admin@123") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid admin password. Access denied.",
                },
                { status: 401 }
            );
        }

        // 1. Reset seats to AVAILABLE
        let seatQuery = supabase
            .from("seats")
            .update({ status: "AVAILABLE" });

        if (eventId) {
            seatQuery = seatQuery.eq("event_id", Number(eventId));
        } else {
            seatQuery = seatQuery.gt("id", 0);
        }

        const { error: seatError } = await seatQuery;

        if (seatError) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to reset seats: ${seatError.message}`,
                },
                { status: 500 }
            );
        }

        // 2. Cancel all active holds so they do not block future reservations
        const { error: holdError } = await supabase
            .from("holds")
            .update({ status: "CANCELLED" })
            .in("status", ["ACTIVE", "EXPIRED", "CONVERTED"]);

        if (holdError) {
            console.error("Admin Reset: Error updating holds:", holdError);
        }

        // 3. Cancel all confirmed tickets so uniqueness constraints and 1-per-user limits are freed
        const { error: ticketError } = await supabase
            .from("tickets")
            .update({ status: "CANCELLED" })
            .eq("status", "CONFIRMED");

        if (ticketError) {
            console.error("Admin Reset: Error updating tickets:", ticketError);
        }

        // 4. Cancel active waitlist entries so queue is clear for new testing
        const { error: waitlistError } = await supabase
            .from("waitlist")
            .update({ status: "CANCELLED" })
            .in("status", ["WAITING", "OFFERED"]);

        if (waitlistError) {
            console.error("Admin Reset: Error updating waitlist:", waitlistError);
        }

        return NextResponse.json({
            success: true,
            message: "All seats have been reset to AVAILABLE. Active holds, confirmed tickets, and queues have been cleared.",
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to reset seats";
        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 500 }
        );
    }
}

