import {SharedWorker} from "../SharedWorker";
import {StartSyncRequest, StartSyncResponse, SyncEvent, SyncRequestType, SyncStatusChanged} from "../types/sync";
import {Event, makeEventId} from "../types/base";

export class SyncWorker extends SharedWorker {
    private readonly _eventBus: BroadcastChannel;

    constructor() {
        super();
        this._eventBus = new BroadcastChannel(this.name);
        this.setHandler(SyncRequestType.StartSync, this.startSync.bind(this));
    }

    async startSync(request: StartSyncRequest): Promise<StartSyncResponse> {
        const response: StartSyncResponse = {request, data: {}};

        const event: SyncStatusChanged = {
            id: makeEventId(),
            type: SyncEvent.StatusChanged,
            data: {
                newValue: "Stopped",
            }
        }
        this.broadcastEvent(event);

        return response;
    }

    broadcastEvent(event: Event) {
        this._eventBus.postMessage(event);
    }
}
