import { BillingInterval } from "../enums/billing-interval.enum";

/** Calendar periods preserve UTC time and clamp short months. */
export function recurringPeriodEnd(
    start: Date,
    interval: BillingInterval,
    anchorDay: number = start.getUTCDate(),
): Date {
    if(!Number.isFinite(start.getTime())) {
        throw new Error("A valid period start is required.");
    }

    const months = interval === BillingInterval.MONTHLY ? 1
        : interval === BillingInterval.QUARTERLY ? 3
        : interval === BillingInterval.ANNUALLY ? 12
        : null;

    if(months === null) {
        throw new Error("A recurring billing interval is required.");
    }
    if(!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) {
        throw new Error("A valid billing anchor day is required.");
    }

    const first = new Date(start);
    first.setUTCDate(1);
    first.setUTCMonth(first.getUTCMonth() + months);
    const lastDay = new Date(Date.UTC(
        first.getUTCFullYear(), first.getUTCMonth() + 1, 0,
    )).getUTCDate();
    first.setUTCDate(Math.min(anchorDay, lastDay));
    return first;
}
