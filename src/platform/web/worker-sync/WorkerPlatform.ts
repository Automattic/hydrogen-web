import {Clock} from "../dom/Clock";

export class WorkerPlatform {
    private readonly _clock: Clock;

    constructor() {
        this._clock = new Clock;
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
}
