import {ISessionInfo} from "../../../matrix/sessioninfo/localstorage/SessionInfoStorage";

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
    async start(payload: StartSyncPayload): Promise<Payload> {
        console.log(`Starting sync for session with id ${payload.sessionInfo.id}`);
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
