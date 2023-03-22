import {Clock} from "../../web/dom/Clock";
import {RequestFunction} from "../../types/types";
import {createFetchRequest} from "../../web/dom/request/fetch";

// Same as Platform but only implements methods called by Sync.
export class SyncPlatform {
    private readonly _clock: Clock;
    private _assetPaths: any;
    private readonly _request: RequestFunction;

    constructor({assetPaths}) {
        this._assetPaths = assetPaths;
        this._clock = new Clock;
        this._request = createFetchRequest(this._clock.createTimeout);
    }

    loadOlm() {
        return null;
    }

    async loadOlmWorker() {
        return null;
    }

    get clock(): Clock {
        return this._clock;
    }

    get request(): RequestFunction {
        return this._request;
    }
}
