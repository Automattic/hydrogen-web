/// <reference lib="webworker" />
declare let self: DedicatedWorkerGlobalScope

type RequestType = string;

export type RequestData = object;
export type ResponseData = object;

export interface Request {
    type: RequestType;
    data: RequestData;
}

export interface Response {
    request: Request;
    error?: Error;
    data?: ResponseData;
}

type RequestHandler = (request: Request) => Promise<ResponseData>;
type HandlerMap = Map<RequestType, RequestHandler>;

export abstract class Worker {
    private readonly _handlers: HandlerMap = new Map;

    protected constructor() {
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        if (!isWorker) {
            throw `${this.class} can only be used in Workers, it cannot be used in the main thread.`;
        }
    }

    protected addHandler(type: RequestType, handler: RequestHandler) {
        this._handlers.set(type, handler);
    }

    protected async init(): Promise<void> {
        // Extending classes can override this method as needed to perform async initialization.
        return;
    }

    async start() {
        if (self.onmessage) {
            throw `${this.class} is already started`;
        }

        await this.init();
        self.onmessage = (event: MessageEvent) => void this.onRequest(event);
        postMessage({ started: true });
    }

    private async onRequest(event: MessageEvent) {
        const request = event.data as Request;
        const response = await this.handle(request);
        postMessage(response);
    }

    private async handle(request: Request): Promise<Response> {
        const handler = this._handlers.get(request.type);
        if (!handler) {
            throw `No handler is registered in ${this.class} for requests of type ${request.type}`;
        }

        try {
            const responseData = await handler(request);
            return {
                request: request,
                data: responseData,
            };
        } catch (error) {
            console.error(error);
            return {
                request: request,
                error: error,
            };
        }
    }

    private get class(): string {
        // Returns the name of the actual class that extends Worker.
        return this.constructor.name;
    }
}
