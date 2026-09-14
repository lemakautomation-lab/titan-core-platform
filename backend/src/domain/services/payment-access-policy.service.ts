import { Payment } from "../entities/payment.entity";
import { PaymentStatus } from "../enums/payment-status.enum";

export class PaymentAccessPolicyService {

    canAccess(
        payment: Payment | null,
    ): boolean {

        return payment?.status ===
            PaymentStatus.CONFIRMED;

    }

}