import { AsyncLocalStorage } from "node:async_hooks";
import { SecurityContext } from "../security/security-context";

export interface RequestContext {
    requestId: string;

    security?: SecurityContext;
}

class RequestContextService {

    private readonly storage =
        new AsyncLocalStorage<RequestContext>();

    run(
        context: RequestContext,
        callback: () => void,
    ): void {

        this.storage.run(
            context,
            callback,
        );
    }


    get(): RequestContext | undefined {

        return this.storage.getStore();

    }

}

export const requestContextService =
    new RequestContextService();
