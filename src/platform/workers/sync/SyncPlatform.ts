import {Clock} from "../../web/dom/Clock";
import {RequestFunction} from "../../types/types";
import {createFetchRequest} from "../../web/dom/request/fetch";
import type * as OlmNamespace from "@matrix-org/olm";
type Olm = typeof OlmNamespace;

type Assets = {
    olmWasmJsPath: string,
    olmWasmPath: string,
}

type Options = {
    assets: Assets,
}

// Same as Platform but only implements methods needed to run sync.
export class SyncPlatform {
    private readonly _clock: Clock;
    private readonly _request: RequestFunction;
    private readonly _assets: Assets;
    private _olm: Olm;

    constructor(options: Options) {
        const {assets} = options;
        this._assets = assets;
        this._clock = new Clock;
        this._request = createFetchRequest(this._clock.createTimeout);
    }

    async loadOlm(): Promise<Olm> {
        // Mangle the globals enough to make olm believe it is running in a browser.
        // @ts-ignore
        self.window = self;
        // @ts-ignore
        self.document = {};

        importScripts(this._assets.olmWasmJsPath);
        this._olm = self.Olm;
        await this._olm.init({locateFile: () => this._assets.olmWasmPath});

        return this._olm;
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
