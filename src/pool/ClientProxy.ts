import {ClientPool, SessionId} from "./ClientPool";
import {Client} from "../matrix/Client";

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
}
