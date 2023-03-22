import {SharedWorker} from "../SharedWorker";
import {StartSyncRequest, StartSyncResponse, SyncEvent, SyncRequestType, SyncStatusChanged} from "../types/sync";
import {Event, makeEventId} from "../types/base";
import {SyncPlatform} from "./SyncPlatform";
import assetPaths from "../../web/sdk/paths/vite";
import {Reconnector} from "../../../matrix/net/Reconnector";
import {ExponentialRetryDelay} from "../../../matrix/net/ExponentialRetryDelay";
import {OnlineStatus} from "../../web/dom/OnlineStatus";
import {SessionFactory} from "../../../matrix/SessionFactory";
import {FeatureSet} from "../../../features";

export class SyncWorker extends SharedWorker {
    private readonly _eventBus: BroadcastChannel;
    private readonly _platform: SyncPlatform;
    private readonly _features: FeatureSet;
    private readonly _onlineStatus: OnlineStatus;
    private readonly _reconnector: Reconnector;
    private readonly _sessionFactory: SessionFactory;

    constructor() {
        super();
        this._eventBus = new BroadcastChannel(this.name);
        this._platform = new SyncPlatform({assetPaths});
        this._features = new FeatureSet;
        this._onlineStatus = new OnlineStatus;
        this._reconnector = new Reconnector({
            onlineStatus: this._onlineStatus,
            retryDelay: new ExponentialRetryDelay(this._platform.clock.createTimeout),
            createMeasure: this._platform.clock.createMeasure
        });
        this._sessionFactory = new SessionFactory({
            platform: this._platform,
            features: this._features,
            reconnector: this._reconnector,
        })

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
