import { Payment } from "../../domain/entities/payment.entity";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { PaymentStatus } from "../../domain/enums/payment-status.enum";
import { DatabaseService } from "../database/database.service";
import { PaymentMapper } from "../mappers/payment.mapper";

export class PrismaPaymentRepository
implements PaymentRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Payment | null> {

        const payment=
            await this.database.prisma.payment.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return payment
            ? PaymentMapper.toDomain(payment)
            : null;

    }

    async findLatestConfirmed(
        userId: string,
        productId: string,
        tenantId: string,
    ): Promise<Payment | null> {

        const payment=
            await this.database.prisma.payment.findFirst({
                where: {
                    userId,
                    productId,
                    tenantId,
                    status: "CONFIRMED",
                },
                orderBy: {
                    confirmedAt: "desc",
                },
            });

        return payment
            ? PaymentMapper.toDomain(payment)
            : null;

    }

    async create(
        payment: Payment,
    ): Promise<Payment> {

        const created=
            await this.database.prisma.payment.create({
                data: PaymentMapper.toPersistence(payment),
            });

        return PaymentMapper.toDomain(created);

    }

    async update(
        payment: Payment,
    ): Promise<Payment> {

        const previousStatus = payment.status === PaymentStatus.REFUNDED
            ? PaymentStatus.CONFIRMED
            : PaymentStatus.PENDING;

        if(payment.status === PaymentStatus.PENDING) {
            throw new Error("A payment state transition is required.");
        }

        if(
            payment.status === PaymentStatus.CONFIRMED &&
            (!payment.providerReference || !payment.confirmedAt)
        ) {
            throw new Error("Confirmed payment requires provider evidence.");
        }

        if(
            payment.status === PaymentStatus.REFUNDED &&
            (!payment.providerReference || !payment.confirmedAt)
        ) {
            throw new Error("Refunded payment requires prior confirmation evidence.");
        }

        if(
            (payment.status === PaymentStatus.FAILED ||
                payment.status === PaymentStatus.CANCELLED) &&
            (payment.providerReference !== null || payment.confirmedAt !== null)
        ) {
            throw new Error("Unconfirmed payment cannot carry confirmation evidence.");
        }

        const result=
            await this.database.prisma.payment.updateMany({
                where: {
                    id: payment.id,
                    tenantId: payment.tenantId,
                    status: previousStatus,
                },
                data: {
                    status: payment.status,
                    ...(payment.status === PaymentStatus.CONFIRMED
                        ? {
                            providerReference: payment.providerReference,
                            confirmedAt: payment.confirmedAt,
                        }
                        : {}),
                },
            });

        if(result.count !== 1) {
            throw new Error(
                "Payment was not found in the tenant or its state changed.",
            );
        }

        const updated=await this.findById(
            payment.id,
            payment.tenantId,
        );

        if(!updated) {
            throw new Error(
                "Payment could not be reloaded.",
            );
        }

        return updated;

    }

}
