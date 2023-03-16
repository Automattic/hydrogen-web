import {SharedWorker} from "../SharedWorker";
import {StartSyncRequest, StartSyncResponse, SyncRequestType} from "../types/sync";

export class SyncWorker extends SharedWorker {
    constructor() {
        super();
        this.setHandler(SyncRequestType.StartSync, this.startSync.bind(this));
    }

    async startSync(request: StartSyncRequest, response: StartSyncResponse): Promise<StartSyncResponse> {
        return response;
    }
}
