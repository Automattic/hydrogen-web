import {Sync, SyncStatus} from "./Sync";
import {HomeServerApi} from "./net/HomeServerApi";
import {Session} from "./Session";
import {Storage} from "./storage/idb/Storage";
import {Logger} from "../logging/Logger";
import {WorkerFacade} from "../platform/web/worker-sync/worker/WorkerFacade";
import {StartSyncRequest} from "../platform/web/worker-sync/SyncWorker";

interface SyncOptions {
    hsApi: HomeServerApi,
    session: Session,
    storage: Storage,
    logger: Logger
}

export class SyncInWorker extends Sync {
    private _worker: WorkerFacade;

    constructor(options: SyncOptions) {
        super(options);
        this._worker = new WorkerFacade;
    }

    get status(): SyncStatus {
        return super.status;
    }

    get error(): Error {
        return super.error;
    }

    start(): void {
        const message = new StartSyncRequest({
            sessionInfo: super.options.sessionInfo,
        });
        const result = this._worker.sendAndWaitForReply(message);
    }

    stop(): void {
        super.stop();
    }
}
