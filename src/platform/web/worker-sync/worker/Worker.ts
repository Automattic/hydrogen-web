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

    start() {
        if (self.onmessage) {
            throw `${this.class} is already started`;
        }

        self.onmessage = (event: MessageEvent) => void this.onRequest(event);
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
