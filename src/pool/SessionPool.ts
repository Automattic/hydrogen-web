import {Platform} from "../platform/web/Platform";
import {FeatureSet} from "../features";
import {AccountSetup, Client, LoadStatus} from "../matrix/Client";
import {ObservableValue} from "../observable/value";

type SessionId = string;

export class SessionPool {
    private readonly _clients: Map<SessionId, Client> = new Map;
    private readonly _platform: Platform;
    private readonly _features: FeatureSet;

    constructor(platform: Platform, features: FeatureSet) {
        this._platform = platform;
        this._features = features;
    }

    // TODO REFACTOR: Make this method private since client should not be exposed.
    client(sessionId: SessionId): Client {
        if (!this._clients.has(sessionId)) {
            throw `Session with id ${sessionId} not found in pool`;
        }

        return this._clients.get(sessionId);
    }

    startWithExistingSession(sessionId: SessionId) {
        if (this._clients.has(sessionId)) {
            throw `Session with id ${sessionId} is already in pool`;
        }
        const client = new Client(this._platform, this._features);
        this._clients.set(sessionId, client);
        client.startWithExistingSession(sessionId);
    }

    loadStatus(sessionId: SessionId): ObservableValue<LoadStatus> {
        return this.client(sessionId).loadStatus;
    }

    accountSetup(sessionId: SessionId): AccountSetup {
        return this.client(sessionId).accountSetup;
    }
}
