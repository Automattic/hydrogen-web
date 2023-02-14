import {ClientPool, SessionId} from "./ClientPool";
import {AccountSetup, Client, LoadStatus} from "../matrix/Client";
import {SyncStatus} from "../matrix/Sync";
import {ObservableValue} from "../observable/value";

export class ClientProxy {
    private readonly _sessionId: SessionId;
    private readonly _clientPool: ClientPool;

    constructor(sessionId: SessionId, clientPool: ClientPool) {
        this._sessionId = sessionId;
        this._clientPool = clientPool;
    }

    // TODO REFACTOR: Make this method private since client should not be exposed.
    public get client(): Client {
        return this._clientPool.client(this._sessionId);
    }

    loadStatus(): ObservableValue<LoadStatus> {
        return this.client.loadStatus;
    }

    loadError(): Error {
        return this.client.loadError;
    }

    accountSetup(): AccountSetup {
        return this.client.accountSetup;
    }

    syncStatus(): ObservableValue<SyncStatus> {
        return this.client.sync.status;
    }

    startLogout() {
        return this.client.startLogout(this._sessionId);
    }

    dispose() {
        this.client.dispose();
    }
}
