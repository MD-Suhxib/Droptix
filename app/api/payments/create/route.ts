import { NextResponse } from "next/server";
import { fakePayment } from "@/lib/fake-payment";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            holdId,
            amount,
            delayMs,
            shouldFail,
            duplicateCallback,
        } = body;

        if (!holdId || !amount) {
            return NextResponse.json(
                {
                    success: false,
                    error: "holdId and amount are required",
                },
                { status: 400 }
            );
        }

        // Simulate the external payment provider.
        const payment = await fakePayment({
            delayMs,
            shouldFail,
        });

        // Simulate a failed payment.
        if (payment.status === "FAILED") {
            return NextResponse.json({
                success: false,
                paymentStatus: "FAILED",
                providerPaymentId: payment.providerPaymentId,
            });
        }

        // Send the successful payment callback.
        const webhookResponse = await fetch(
            `${new URL(request.url).origin}/api/payments/webhook`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    holdId,
                    providerPaymentId: payment.providerPaymentId,
                    amount,
                    status: payment.status,
                }),
            }
        );

        const webhookResult = await webhookResponse.json();

        // Simulate the provider sending the exact same callback twice.
        let duplicateResult = null;

        if (duplicateCallback) {
            const duplicateResponse = await fetch(
                `${new URL(request.url).origin}/api/payments/webhook`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        holdId,
                        providerPaymentId: payment.providerPaymentId,
                        amount,
                        status: payment.status,
                    }),
                }
            );

            duplicateResult = await duplicateResponse.json();
        }

        return NextResponse.json({
            success: true,
            paymentStatus: payment.status,
            providerPaymentId: payment.providerPaymentId,
            webhook: webhookResult,
            duplicateCallback: duplicateResult,
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "Payment request failed",
            },
            { status: 500 }
        );
    }
}