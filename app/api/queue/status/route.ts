import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const eventId = searchParams.get("eventId");
        const userId = searchParams.get("userId");

        if (!eventId || !userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "eventId and userId are required",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("waitlist")
            .select("id, position, status")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .eq("status", "WAITING")
            .maybeSingle();

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User is not currently in the queue",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            queue: {
                waitlist_id: data.id,
                queue_position: data.position,
                status: data.status,
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