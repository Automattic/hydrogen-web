import {SharedWorker} from "../SharedWorker";
import {StartSyncRequest, StartSyncResponse, SyncEvent, SyncRequestType, SyncStatusChanged} from "../types/sync";
import {Event, makeEventId} from "../types/base";
import {SyncPlatform} from "./SyncPlatform";
import {Reconnector} from "../../../matrix/net/Reconnector";
import {ExponentialRetryDelay} from "../../../matrix/net/ExponentialRetryDelay";
import {OnlineStatus} from "../../web/dom/OnlineStatus";
import {SessionFactory} from "../../../matrix/SessionFactory";
import {Session} from "../../../matrix/Session";
import {FeatureSet} from "../../../features";
import {StorageFactory} from "../../../matrix/storage/idb/StorageFactory";
import {Logger} from "../../../logging/Logger";
import {ConsoleReporter} from "../../../logging/ConsoleReporter";
import {Storage} from "../../../matrix/storage/idb/Storage";
import {RequestScheduler} from "../../../matrix/net/RequestScheduler";
import {Sync} from "../../../matrix/Sync";

type Assets = {
    olmWasmJsPath: string,
    olmWasmPath: string,
}

type Options = {
    assets: Assets,
}

export class SyncWorker extends SharedWorker {
    private readonly _eventBus: BroadcastChannel;
    private readonly _platform: SyncPlatform;
    private readonly _features: FeatureSet;
    private readonly _logger: Logger;
    private readonly _storageFactory: StorageFactory;
    private readonly _onlineStatus: OnlineStatus;
    private readonly _reconnector: Reconnector;
    private readonly _sessionFactory: SessionFactory;
    private _session?: Session;
    private _storage?: Storage;
    private _scheduler?: RequestScheduler;
    private _sync?: Sync;

    constructor(options: Options) {
        super();
        const {assets} = options;
        this._eventBus = new BroadcastChannel(this.name);
        this._platform = new SyncPlatform({assets});
        this._features = new FeatureSet;
        this._logger = new Logger({platform: this._platform});
        this._logger.addReporter(new ConsoleReporter());
        this._storageFactory = new StorageFactory;
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
        if (this._sync) {
            return response;
        }

        const {session, storage, scheduler} = await this.loadSession(request);
        if (!session.hasIdentity) {
            // We should never get here, but in case we do, we must not proceed.
            response.error = new Error("Sync was started before the session was correctly initiated");
            return response;
        }

        this._session = session;
        this._storage = storage;
        this._scheduler = scheduler;

        this._sync = new Sync({
            logger: this._logger,
            hsApi: this._scheduler.hsApi,
            session: this._session,
            storage: this._storage,
        })

        this._sync.start();

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

    private async loadSession(request: StartSyncRequest): Promise<{session: Session, storage: Storage, scheduler: RequestScheduler}> {
        const sessionInfo = {
            id: request.data.sessionId,
            deviceId: request.data.deviceId,
            userId: request.data.userId,
            homeServer: request.data.homeserver,
            accessToken: request.data.accessToken,
        }

        let storage;
        await this._logger.run("sync worker: init storage", async log => {
            storage = await this._storageFactory.create(sessionInfo.id, log)
        });

        const olm = await this._platform.loadOlm();
        const olmWorker = await this._platform.loadOlmWorker();
        const {session, scheduler} = this._sessionFactory.make({
            storage,
            olm,
            olmWorker,
            sessionInfo,
        });

        await this._logger.run("sync worker: load session", async log => {
            await session.load(log);
        });

        return {session, storage, scheduler};
    }
}
