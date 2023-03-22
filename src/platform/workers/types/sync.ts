import {Request, Response, Event} from "./base";

//
// Requests/Responses
//

export enum SyncRequestType {
    StartSync = "StartSync",
}

export interface StartSyncRequest extends Request {
    type: SyncRequestType.StartSync;
    data: {
        sessionId: string,
        deviceId: string,
        userId: string,
        homeserver: string,
        accessToken: string,
    }
}
export interface StartSyncResponse extends Response {
    request: StartSyncRequest;
    data: {}
}

//
// Events
//

export enum SyncEvent {
    StatusChanged = "StatusChanged",
}

export interface SyncStatusChanged extends Event {
    type: SyncEvent.StatusChanged;
    data: {
        newValue: string,
    }
}
