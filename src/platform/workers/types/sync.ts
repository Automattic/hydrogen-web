import {Request, Response} from "./base";

export enum SyncRequestType {
    StartSync = "StartSync",
}

export interface StartSyncRequest extends Request {
    type: SyncRequestType.StartSync;
    data: {
        sessionId: string,
    }
}
export interface StartSyncResponse extends Response {
    request: StartSyncRequest;
    data: {}
}
