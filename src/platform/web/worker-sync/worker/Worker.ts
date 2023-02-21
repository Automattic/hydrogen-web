/// <reference lib="webworker" />
declare let self: DedicatedWorkerGlobalScope

export type MessageBody = object;
export type ResultBody = object;

type MessageType = string;

interface Message {
    type: MessageType,
    body: MessageBody
}
interface Result {
    type: MessageType,
    body: ResultBody,
}

type MessageHandler = (body: MessageBody) => Promise<ResultBody>;
type HandlerMap = Map<MessageType, MessageHandler>;

export abstract class Worker {
    private readonly _handlers: HandlerMap = new Map;

    protected constructor() {
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        if (!isWorker) {
            throw `${this.class} can only be used in Workers, it cannot be used in the main thread.`;
        }
    }

    protected addHandler(type: MessageType, handler: MessageHandler) {
        this._handlers.set(type, handler);
    }

    start() {
        if (self.onmessage) {
            throw `${this.class} is already started`;
        }

        self.onmessage = (event: MessageEvent) => void this.onMessage(event);
    }

    private async onMessage(event: MessageEvent) {
        const message = event.data as Message;
        try {
            const result = await this.handle(message);
            postMessage(result);
        } catch (error) {
            console.error(error);
            return;
        }
    }

    private async handle(message: Message): Promise<Result> {
        const handler = this._handlers.get(message.type);

        if (!handler) {
            throw `No handler is registered in ${this.class} for messages of type ${message.type}`;
        }

        const result = await handler(message.body);
        return {
            type: message.type,
            body: result,
        };
    }

    private get class(): string {
        // Returns the name of the actual class that extends Worker.
        return this.constructor.name;
    }
}
