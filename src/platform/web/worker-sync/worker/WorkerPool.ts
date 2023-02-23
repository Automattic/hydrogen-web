type WorkerId = string;

export abstract class WorkerPool {
    private readonly _workerAssetPath: string;
    private readonly _workers: Map<WorkerId, Worker> = new Map;

    protected constructor(workerAssetPath: string) {
        this._workerAssetPath = workerAssetPath;
    }

    async start(id: WorkerId) {
        const worker = new Worker(this._workerAssetPath, {type: "module"});
        worker.onmessageerror
        worker.onerror
        worker.onmessage
        this._workers.set(id, worker);
    }

    async stop(id: WorkerId) {
        const worker = this._workers.get(id);
        if (!worker) {
            throw `Worker with id ${id} does not exist`;
        }

        worker.terminate();
        this._workers.delete(id);
    }
}
