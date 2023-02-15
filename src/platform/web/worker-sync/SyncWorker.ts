import {ISessionInfo} from "../../../matrix/sessioninfo/localstorage/SessionInfoStorage";
import {HomeServerApi} from "../../../matrix/net/HomeServerApi";
import {createFetchRequest} from "../dom/request/fetch";
import {Clock} from "../dom/Clock";
import {Reconnector} from "../../../matrix/net/Reconnector";
import {ExponentialRetryDelay} from "../../../matrix/net/ExponentialRetryDelay";
import {OnlineStatus} from "../dom/OnlineStatus";

type Payload = object;

export enum SyncWorkerMessageType {
    StartSync,
}

interface Message {
    type: SyncWorkerMessageType,
    payload: Payload
}

export interface StartSyncPayload extends Payload {
    sessionInfo: ISessionInfo,
}

class SyncWorker {
    private _clock: Clock;
    private _reconnector: Reconnector;

    async start(payload: StartSyncPayload): Promise<Payload> {
        const sessionInfo = payload.sessionInfo;
        console.log(`Starting sync worker for session with id ${sessionInfo.id}`);

        this._clock = new Clock;

        this._reconnector = new Reconnector({
            onlineStatus: new OnlineStatus(),
            retryDelay: new ExponentialRetryDelay(this._clock.createTimeout),
            createMeasure: this._clock.createMeasure
        });

        const hsApi = new HomeServerApi({
            homeserver: sessionInfo.homeserver,
            accessToken: sessionInfo.accessToken,
            request: createFetchRequest(this._clock.createTimeout),
            reconnector: this._reconnector,
        });


        return payload;
    }
}

const worker = new SyncWorker();
// @ts-ignore
self.syncWorker = worker;

self.onmessage = (event: MessageEvent) => {
    const data: Message = event.data;

    let promise: Promise<Payload>;
    switch (data.type) {
        case SyncWorkerMessageType.StartSync:
            promise = worker.start(data.payload as StartSyncPayload);
            break;
    }

    promise.then((reply: Payload) => {
        postMessage(reply);
    }).catch(error => console.error(error))
};
