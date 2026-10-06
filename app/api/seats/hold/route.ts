import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { seatId, userId } = body;

        if (!seatId || !userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "seatId and userId are required",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.rpc("hold_seat", {
            p_seat_id: seatId,
            p_user_id: userId,
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
            hold: data?.[0] ?? null,
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