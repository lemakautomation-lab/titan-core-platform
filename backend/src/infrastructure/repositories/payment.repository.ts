import { Payment } from "../../domain/entities/payment.entity";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
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

        const result=
            await this.database.prisma.payment.updateMany({
                where: {
                    id: payment.id,
                    tenantId: payment.tenantId,
                },
                data: PaymentMapper.toPersistence(payment),
            });

        if(result.count !== 1) {
            throw new Error(
                "Payment was not found in the tenant.",
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