/*
Copyright 2023 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {ISync} from "../../../matrix/ISync";
import {ObservableValue} from "../../../observable/value";
import {SyncStatus} from "../../../matrix/Sync";
import {Session} from "../../../matrix/Session";
import {makeSyncWorker} from "./make-worker";
import {
    StartSyncRequest,
    StartSyncResponse,
    SyncEvent,
    SyncRequestType,
    SyncStatusChanged
} from "../../workers/types/sync";
import {WorkerProxy} from "../worker/WorkerProxy";
import {EventBus} from "../worker/EventBus";
import {makeRequestId} from "../../workers/types/base";

type Options = {
    session: Session;
}

export class SyncProxy implements ISync {
    private readonly _session: Session;
    private readonly _workerProxy: WorkerProxy;
    private readonly _eventBus: EventBus;
    private readonly _status: ObservableValue<SyncStatus> = new ObservableValue(SyncStatus.Stopped);
    private _error: Error | null = null;

    constructor(options: Options) {
        const {session} = options;
        this._session = session;

        const sessionId = this._session.sessionId;
        if (!sessionId) {
            // Should never happen, but if it does, we must not spawn the worker.
            throw `sessionId is required for starting the sync worker`;
        }

        const workerId = `sync-${sessionId}`;
        this._workerProxy = new WorkerProxy(makeSyncWorker(workerId) as SharedWorker);
        this._eventBus = new EventBus(workerId);
        this._eventBus.setListener(SyncEvent.StatusChanged, this.onStatusChanged.bind(this));
    }

    get status(): ObservableValue<SyncStatus> {
        return this._status;
    }

    get error(): Error | null {
        return this._error;
    }

    async start(): Promise<void> {
        const request: StartSyncRequest = {
            id: makeRequestId(),
            type: SyncRequestType.StartSync,
            data: {
                sessionId: this._session.sessionId,
                deviceId: this._session.deviceId,
                userId: this._session.userId,
                homeserver: this._session.homeserver,
                accessToken: this._session.accessToken,
            }
        };

        const response = await this._workerProxy.sendAndWaitForResponse(request) as StartSyncResponse;
        if (response?.error) {
            throw response.error;
        }

        // TODO
        console.log(response);
    }

    stop(): void {
        // TODO
    }

    private onStatusChanged(event: SyncStatusChanged): void {
        this._status.set(event.data.newValue);
    }
}
