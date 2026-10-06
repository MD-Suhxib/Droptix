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

        return NextResponse.json({
            success: true,
            payment: data?.[0] ?? null,
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