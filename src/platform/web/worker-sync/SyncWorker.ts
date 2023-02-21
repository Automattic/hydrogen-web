import {ISessionInfo} from "../../../matrix/sessioninfo/localstorage/SessionInfoStorage";
import {HomeServerApi} from "../../../matrix/net/HomeServerApi";
import {createFetchRequest} from "../dom/request/fetch";
import {Reconnector} from "../../../matrix/net/Reconnector";
import {ExponentialRetryDelay} from "../../../matrix/net/ExponentialRetryDelay";
import {OnlineStatus} from "../dom/OnlineStatus";
import {Sync} from "../../../matrix/Sync";
import {Session} from "../../../matrix/Session";
import {WorkerPlatform} from "./WorkerPlatform";
import {Storage} from "../../../matrix/storage/idb/Storage";
import {StorageFactory} from "../../../matrix/storage/idb/StorageFactory";
import {MediaRepository} from "../../../matrix/net/MediaRepository";
import {FeatureSet} from "../../../features";
import {Logger} from "../../../logging/Logger";
import {ConsoleReporter} from "../../../logging/ConsoleReporter";
import assetPaths from "../sdk/paths/vite";
import {MessageBody, ResultBody, Worker} from "./worker/Worker";

export enum SyncMessageType {
    StartSync = "StartSync",
}

export interface StartSyncMessage extends MessageBody {
    sessionInfo: ISessionInfo,
}

export interface StartSyncResult extends ResultBody {
    success: boolean,
}

export class SyncWorker extends Worker {
    private _reconnector: Reconnector;
    private _platform: WorkerPlatform;
    private _storage: Storage;
    private _sync: Sync;

    constructor() {
        super();
        super.addHandler(SyncMessageType.StartSync, this.startSync.bind(this));
    }

    async startSync(message: StartSyncMessage): Promise<StartSyncResult> {
        const sessionInfo = message.sessionInfo;
        console.log(`Starting sync worker for session with id ${sessionInfo.id}`);

        this._platform = new WorkerPlatform({assetPaths});

        this._reconnector = new Reconnector({
            onlineStatus: new OnlineStatus(),
            retryDelay: new ExponentialRetryDelay(this._platform.clock.createTimeout),
            createMeasure: this._platform.clock.createMeasure
        });

        const hsApi = new HomeServerApi({
            homeserver: sessionInfo.homeserver,
            accessToken: sessionInfo.accessToken,
            request: createFetchRequest(this._platform.clock.createTimeout),
            reconnector: this._reconnector,
        });

        const logger = new Logger({platform: this._platform});
        logger.addReporter(new ConsoleReporter());

        const storageFactory = new StorageFactory();
        await logger.run("", async log => {
            this._storage = await storageFactory.create(sessionInfo.id, log)
        });

        const olm = this._platform.loadOlm();
        const olmWorker = await this._platform.loadOlmWorker();

        const mediaRepository = new MediaRepository({
            homeserver: sessionInfo.homeServer,
            platform: this._platform,
        });

        const features = new FeatureSet;

        const session = new Session({
            storage: this._storage,
            hsApi,
            sessionInfo,
            olm,
            olmWorker,
            platform: this._platform,
            mediaRepository,
            features,
        });

        this._sync = new Sync({
            hsApi,
            session,
            storage: this._storage,
            logger,
        });

        return { success: true };
    }
}
