import {Sync} from "./Sync";
import {HomeServerApi} from "./net/HomeServerApi";
import {Session} from "./Session";
import {Storage} from "./storage/idb/Storage";
import {Logger} from "../logging/Logger";

interface SyncOptions {
    hsApi: HomeServerApi,
    session: Session,
    storage: Storage,
    logger: Logger
}

export class SyncInWorker extends Sync {
    constructor(options: SyncOptions) {
        super(options);
    }
}
