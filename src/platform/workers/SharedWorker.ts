import {BaseWorker} from "./BaseWorker";
import {Request} from "./types/base";

declare const self;
declare const SharedWorkerGlobalScope;

export abstract class SharedWorker extends BaseWorker {
    protected constructor() {
        super();
        const isSharedWorker = self instanceof SharedWorkerGlobalScope;
        if (!isSharedWorker) {
            throw `SharedWorker can only be used in a SharedWorker context`;
        }

        self.onconnect = (event: MessageEvent) => {
            const port = event.ports[0];
            port.onmessage = async (event: MessageEvent) => await this.onRequest(event, port);
        };
    }

    protected async onRequest(event: MessageEvent, port: MessagePort) {
        const request = event.data as Request;
        const response = await this.handleRequest(request);
        port.postMessage(response);
    }

    protected get name(): string {
        return self.name;
    }
}
