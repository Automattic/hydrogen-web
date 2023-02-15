export class SyncWorkerPool {
    private readonly _worker: Worker;

    constructor(path: string) {
        this._worker = new Worker(path, {type: "module"});
        this._worker.postMessage({
            hello: {
                foo: "foo",
                bar: "bar",
            },
            world: {
                baz: "baz"
            },
        });
        this._worker.onmessage = (e) => {
            const reply = e.data;
            console.log(reply);
        }
    }
}
