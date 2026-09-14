import { Payment } from "../entities/payment.entity";

export interface PaymentRepository {

    findById(
        id: string,
        tenantId: string,
    ): Promise<Payment | null>;

    findLatestConfirmed(
        userId: string,
        productId: string,
        tenantId: string,
    ): Promise<Payment | null>;

    create(
        payment: Payment,
    ): Promise<Payment>;

    update(
        payment: Payment,
    ): Promise<Payment>;

}