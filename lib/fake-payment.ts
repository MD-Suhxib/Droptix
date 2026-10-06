type PaymentResult = {
    providerPaymentId: string;
    status: "PAID" | "FAILED";
};

type PaymentOptions = {
    delayMs?: number;
    shouldFail?: boolean;
    duplicateCallback?: boolean;
};

export async function fakePayment(
    options: PaymentOptions = {}
): Promise<PaymentResult> {
    const delayMs = options.delayMs ?? 1000;
    const shouldFail = options.shouldFail ?? false;

    // Simulate a slow payment provider.
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const providerPaymentId = `fake-payment-${Date.now()}`;

    if (shouldFail) {
        return {
            providerPaymentId,
            status: "FAILED",
        };
    }

    return {
        providerPaymentId,
        status: "PAID",
    };
}