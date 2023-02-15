type SessionId = string;

export class SyncWorkerPool {
    private readonly _workers: Map<SessionId, Worker> = new Map;
    private readonly _path: string;

    constructor(path: string) {
        this._path = path;
    }

    add(sessionId: SessionId) {
        if (this._workers.size > 0) {
            throw "Currently there can only be one active sync worker";
        }

        if (this._workers.has(sessionId)) {
            throw `Session with id ${sessionId} already has a sync worker`;
        }

        const worker = new Worker(this._path, {type: "module"});
        this._workers.set(sessionId, worker);
        worker.onmessage = event => {
            const data = event.data;
            console.log(data);
        }

        worker.postMessage({
            hello: {
                foo: "foo",
                bar: "bar",
            },
            world: {
                baz: "baz"
            },
        });
    }

    remove(sessionId: SessionId) {
        // TODO
    }
}
