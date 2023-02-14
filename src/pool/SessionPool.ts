import {Platform} from "../platform/web/Platform";
import {FeatureSet} from "../features";
import {Client} from "../matrix/Client";

export class SessionPool {
    private readonly _client: Client;

    constructor(platform: Platform, features: FeatureSet) {
        this._client = new Client(platform, features);
    }

    // TODO REFACTOR: Remove this method since client should not be exposed.
    client(sessionId: string): Client {
        return this._client;
    }

    startWithExistingSession(sessionId: string) {
        this._client.startWithExistingSession(sessionId);
    }
}
