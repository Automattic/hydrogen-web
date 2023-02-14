import {Platform} from "../platform/web/Platform";
import {FeatureSet} from "../features";
import {Client} from "../matrix/Client";
import {ClientProxy} from "./ClientProxy";

export type SessionId = string;

export class ClientPool {
    private readonly _clients: Map<SessionId, Client> = new Map;
    private readonly _platform: Platform;
    private readonly _features: FeatureSet;

    constructor(platform: Platform, features: FeatureSet) {
        this._platform = platform;
        this._features = features;
    }

    loadSession(sessionId: SessionId): ClientProxy {
        const client = new Client(this._platform, this._features);
        this._clients.set(sessionId, client);

        // TODO REFACTOR: Handle case where session doesn't yet exist.
        client.startWithExistingSession(sessionId);

        return new ClientProxy(sessionId, this);
    }

    // TODO REFACTOR: Make this method private since client should not be exposed.
    client(sessionId: SessionId): Client | undefined {
        return this._clients.get(sessionId);
    }
}
