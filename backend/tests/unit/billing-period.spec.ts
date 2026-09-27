import { describe, expect, it } from "vitest";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { recurringPeriodEnd } from "../../src/domain/services/billing-period";

describe("UTC recurring billing periods", () => {
    it("clamps a January 31 monthly period to February 28", () => {
        expect(recurringPeriodEnd(
            new Date("2027-01-31T10:30:00.000Z"), BillingInterval.MONTHLY,
        )).toEqual(new Date("2027-02-28T10:30:00.000Z"));
    });

    it("clamps an annual leap-day period", () => {
        expect(recurringPeriodEnd(
            new Date("2028-02-29T10:30:00.000Z"), BillingInterval.ANNUALLY,
        )).toEqual(new Date("2029-02-28T10:30:00.000Z"));
    });

    it("rejects a one-time interval", () => {
        expect(() => recurringPeriodEnd(
            new Date("2027-01-01T00:00:00.000Z"), BillingInterval.ONE_TIME,
        )).toThrow("A recurring billing interval is required.");
    });
});
