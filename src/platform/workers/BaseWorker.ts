import {RequestType, Request, Response} from "./types/base";

declare const self;
declare const WorkerGlobalScope;

type RequestHandler = (request: Request, response: Response) => Promise<Response>;
type HandlerMap = Map<RequestType, RequestHandler>;

export abstract class BaseWorker {
    private readonly _handlers: HandlerMap = new Map;

    protected constructor() {
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        if (!isWorker) {
            throw `BaseWorker can only be used in workers, it cannot be used in the main thread.`;
        }
    }

    protected setHandler(type: RequestType, handler: RequestHandler) {
        if (this._handlers.has(type)) {
            throw `A handler for requests of type ${type} is already set`;
        }
        this._handlers.set(type, handler);
    }

    protected async handleRequest(request: Request): Promise<Response> {
        let response: Response = {request, data: {}};

        const handler = this._handlers.get(request.type);
        if (!handler) {
            response.error = new Error(`No handler is registered for requests of type ${request.type}`);
            return response;
        }

        try {
            response = await handler(request, response);
        } catch (error) {
            response.error = error;
        }

        return response;
    }
}
