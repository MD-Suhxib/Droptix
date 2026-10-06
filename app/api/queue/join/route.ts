import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { eventId, userId } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "eventId and userId are required",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("join_waitlist", {
      p_event_id: eventId,
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
      queue: data?.[0] ?? null,
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