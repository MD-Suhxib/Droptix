import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId") || "1";

        const { data, error } = await supabase
            .from("seats")
            .select("id, seat_number, status, event_id")
            .eq("event_id", eventId)
            .order("id", { ascending: true });

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        const seats = (data || []).map((row) => ({
            id: row.id,
            seatNumber: row.seat_number,
            status: row.status as "AVAILABLE" | "HELD" | "SOLD",
            price: 10,
        }));

        const availableCount = seats.filter((s) => s.status === "AVAILABLE").length;
        const heldCount = seats.filter((s) => s.status === "HELD").length;
        const soldCount = seats.filter((s) => s.status === "SOLD").length;

        return NextResponse.json({
            success: true,
            seats,
            counts: {
                total: seats.length,
                available: availableCount,
                held: heldCount,
                sold: soldCount,
            },
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch seats",
            },
            { status: 500 }
        );
    }
}
