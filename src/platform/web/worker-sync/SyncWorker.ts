import {ISessionInfo} from "../../../matrix/sessioninfo/localstorage/SessionInfoStorage";
import {HomeServerApi} from "../../../matrix/net/HomeServerApi";
import {createFetchRequest} from "../dom/request/fetch";
import {Reconnector} from "../../../matrix/net/Reconnector";
import {ExponentialRetryDelay} from "../../../matrix/net/ExponentialRetryDelay";
import {OnlineStatus} from "../dom/OnlineStatus";
import {Sync} from "../../../matrix/Sync";
import {Session} from "../../../matrix/Session";
import {WorkerPlatform} from "./WorkerPlatform";
import {StorageFactory} from "../../../matrix/storage/idb/StorageFactory";
import {MediaRepository} from "../../../matrix/net/MediaRepository";
import {FeatureSet} from "../../../features";
import {Logger} from "../../../logging/Logger";
import {ConsoleReporter} from "../../../logging/ConsoleReporter";
import assetPaths from "../sdk/paths/vite";
import {Request, RequestData, ResponseData, Worker} from "./worker/Worker";
import {RequestFunction} from "../../types/types";

enum SyncRequestType {
    StartSync = "StartSync",
}

interface StartSyncRequestData extends RequestData {
    sessionInfo: ISessionInfo,
}

interface StartSyncResponseData extends ResponseData {
    success: boolean,
}

export class StartSyncRequest implements Request {
    readonly type: SyncRequestType;
    readonly data: StartSyncRequestData;

    constructor(data: StartSyncRequestData) {
        this.type = SyncRequestType.StartSync;
        this.data = data;
    }
}

export class SyncWorker extends Worker {
    private readonly _reconnector: Reconnector;
    private readonly _request: RequestFunction;
    private readonly _platform: WorkerPlatform;
    private readonly _storageFactory: StorageFactory;
    private readonly _logger: Logger;
    private readonly _features: FeatureSet;
    private _sync: Sync;
    private _olm: any;
    private _olmWorker: any;

    constructor() {
        super();
        this._platform = new WorkerPlatform({assetPaths});
        this._request = createFetchRequest(this._platform.clock.createTimeout);
        this._reconnector = new Reconnector({
            onlineStatus: new OnlineStatus(),
            retryDelay: new ExponentialRetryDelay(this._platform.clock.createTimeout),
            createMeasure: this._platform.clock.createMeasure
        });
        this._storageFactory = new StorageFactory();
        this._logger = new Logger({platform: this._platform});
        this._logger.addReporter(new ConsoleReporter());
        this._features = new FeatureSet;
    }

    async init() {
        this._olm = this._platform.loadOlm();
        this._olmWorker = await this._platform.loadOlmWorker();

        super.addHandler(SyncRequestType.StartSync, this.startSync.bind(this));
    }

    async startSync(request: StartSyncRequest): Promise<StartSyncResponseData> {
        const sessionInfo = request.data.sessionInfo;
        console.log(`Starting sync worker for session with id ${sessionInfo.id}`);

        const hsApi = new HomeServerApi({
            request: this._request,
            reconnector: this._reconnector,
            homeserver: sessionInfo.homeserver,
            accessToken: sessionInfo.accessToken,
        });

        let storage;
        await this._logger.run("", async log => {
            storage = await this._storageFactory.create(sessionInfo.id, log)
        });

        const mediaRepository = new MediaRepository({
            platform: this._platform,
            homeserver: sessionInfo.homeServer,
        });

        const session = new Session({
            platform: this._platform,
            features: this._features,
            olm: this._olm,
            olmWorker: this._olmWorker,
            storage,
            hsApi,
            sessionInfo,
            mediaRepository,
        });

        this._sync = new Sync({
            logger: this._logger,
            hsApi,
            session,
            storage,
        });

        return { success: true };
    }
}
