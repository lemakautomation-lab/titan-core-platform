import { Payment as PrismaPayment } from "../../generated/prisma/client";

import { Payment } from "../../domain/entities/payment.entity";
import { BillingInterval } from "../../domain/enums/billing-interval.enum";
import { PaymentStatus } from "../../domain/enums/payment-status.enum";

export class PaymentMapper {

    static toDomain(
        prisma: PrismaPayment,
    ): Payment {

        return new Payment(
            prisma.id,
            prisma.tenantId,
            prisma.userId,
            prisma.productId,
            prisma.productPriceId,
            prisma.amountMinor,
            prisma.currency,
            prisma.billingInterval as BillingInterval,
            prisma.status as PaymentStatus,
            prisma.providerReference,
            prisma.confirmedAt,
            prisma.createdAt,
            prisma.updatedAt,
        );

    }

    static toPersistence(
        payment: Payment,
    ) {

        return {
            id: payment.id,
            tenantId: payment.tenantId,
            userId: payment.userId,
            productId: payment.productId,
            productPriceId: payment.productPriceId,
            amountMinor: payment.amountMinor,
            currency: payment.currency,
            billingInterval: payment.billingInterval,
            status: payment.status,
            providerReference: payment.providerReference,
            confirmedAt: payment.confirmedAt,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };

    }

}