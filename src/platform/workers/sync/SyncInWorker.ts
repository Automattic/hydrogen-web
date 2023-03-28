import {
    ArchivedRoomSyncProcessState,
    InviteSyncProcessState,
    RoomSyncProcessState,
    SessionSyncProcessState,
    Sync,
    SyncStatus
} from "../../../matrix/Sync";
import {Logger} from "../../../logging/Logger";
import {HomeServerApi} from "../../../matrix/net/HomeServerApi";
import {Session} from "../../../matrix/Session";
import {Storage} from "../../../matrix/storage/idb/Storage";
import {ObservableValue} from "../../../observable/value";

type Options = {
    logger: Logger,
    hsApi: HomeServerApi,
    session: Session,
    storage: Storage,
    eventBus: BroadcastChannel,
}

export class SyncInWorker extends Sync {
    private _eventBus: BroadcastChannel;

    constructor(options: Options) {
        const {eventBus, ...baseOptions} = options;
        super(baseOptions);
        this._eventBus = eventBus;
    }

    async start() {
        return super.start();
    }

    get status(): ObservableValue<SyncStatus> {
        return super.status;
    }

    _afterSync(
        sessionState: SessionSyncProcessState,
        inviteStates: InviteSyncProcessState[],
        roomStates: RoomSyncProcessState[],
        archivedRoomStates: ArchivedRoomSyncProcessState[],
        log
    ) {
        super._afterSync(sessionState, inviteStates, roomStates, archivedRoomStates, log);
    }
}
