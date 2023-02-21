import {SyncMessageType} from "./SyncWorker";
import {SessionInfoStorage} from "../../../matrix/sessioninfo/localstorage/SessionInfoStorage";

export type SessionId = string;

export class SyncWorkerPool {
    private readonly _workers: Map<SessionId, Worker> = new Map;
    private readonly _path: string;
    private readonly _sessionInfoStorage: SessionInfoStorage;

    constructor(path: string, sessionInfoStorage: SessionInfoStorage) {
        this._path = path;
        this._sessionInfoStorage = sessionInfoStorage;
    }

    async add(sessionId: SessionId) {
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

        const sessionInfo = await this._sessionInfoStorage.get(sessionId);
        worker.postMessage({
            type: SyncMessageType.StartSync,
            body: {
                sessionInfo: sessionInfo
            },
        });
    }

    remove(sessionId: SessionId) {
        // TODO
    }
}
