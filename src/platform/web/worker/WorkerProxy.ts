import {Request, RequestId, Response} from "../../workers/types/base";

type OngoingRequest = {
    resolve: (response: Response) => Promise<Response>;
}

export class WorkerProxy {
    private readonly _requests: Map<RequestId, OngoingRequest> = new Map;
    private readonly _worker: SharedWorker | Worker;

    constructor(worker: SharedWorker | Worker) {
        this._worker = worker;
        if (this._worker instanceof SharedWorker) {
            this._worker.port.onmessage = this.onMessage.bind(this);
        } else {
            this._worker.onmessage = this.onMessage.bind(this);
        }
    }

    async sendAndWaitForResponse(request: Request): Promise<Response> {
        if (this._requests.has(request.id)) {
            throw `A request with id ${request.id} is already ongoing`;
        }

        let resolve;
        const promise = new Promise<Response>(_resolve => {
            resolve = _resolve;
        });

        this._requests.set(request.id, {resolve});
        this.send(request);

        return promise;
    }

    send(request: Request) {
        if (this._worker instanceof SharedWorker) {
            this._worker.port.postMessage(request);
        } else {
            this._worker.postMessage(request);
        }
    }

    private async onMessage(event: MessageEvent) {
        const response = event.data as Response;
        if (!response?.request) {
            return;
        }

        const request = response.request;
        const ongoingRequest = this._requests.get(request.id);
        if (!ongoingRequest) {
            return;
        }

        this._requests.delete(request.id);
        await ongoingRequest.resolve(response);
    }
}
