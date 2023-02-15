import {SessionId} from "./SyncWorkerPool";

type Payload = object;

export enum SyncWorkerMessageType {
    StartSync,
}

interface Message {
    type: SyncWorkerMessageType,
    payload: Payload
}

export interface StartSyncPayload extends Payload {
    sessionId: SessionId,
}

class SyncWorker {
    start(payload: StartSyncPayload): Payload {
        console.log(`Starting sync for session with id ${payload.sessionId}`);
        return payload;
    }
}

const worker = new SyncWorker();
// @ts-ignore
self.syncWorker = worker;

self.addEventListener("message", event => {
    const data: Message = event.data;

    let reply: Payload;
    switch (data.type) {
        case SyncWorkerMessageType.StartSync:
            reply = worker.start(data.payload as StartSyncPayload);
            break;
    }

    postMessage(reply);
});
