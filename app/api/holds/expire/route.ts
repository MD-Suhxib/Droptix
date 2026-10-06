import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
    try {
        const { data, error } = await supabase.rpc("expire_holds");

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            expiredCount: data,
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to expire holds",
            },
            { status: 500 }
        );
    }
}