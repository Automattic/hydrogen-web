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
    AddPendingEventRequest,
    AddPendingEventResponse,
    StartSyncRequest,
    StartSyncResponse,
    SyncChanges,
    SyncEvent,
    SyncRequestType,
    SyncStatusChanged
} from "../../workers/types/sync";
import {WorkerProxy} from "../worker/WorkerProxy";
import {EventBus} from "../worker/EventBus";
import {makeRequestId} from "../../workers/types/base";
import {Logger} from "../../../logging/Logger";
import {ObservableMap} from "../../../observable";
import {type Room} from "../../../matrix/room/Room";
import {PendingEvent} from "../../../matrix/room/sending/PendingEvent";
import {deserializeRoomChanges, deserializeSessionChanges} from "../../workers/sync/serialize";

type Options = {
    session: Session;
    logger: Logger,
}

export class SyncProxy implements ISync {
    private readonly _session: Session;
    private readonly _workerProxy: WorkerProxy;
    private readonly _eventBus: EventBus;
    private readonly _status: ObservableValue<SyncStatus> = new ObservableValue(SyncStatus.Stopped);
    private readonly _logger: Logger;
    private _error: Error | null = null;

    constructor(options: Options) {
        const {session, logger} = options;
        this._session = session;
        this._logger = logger;

        const sessionId = this._session.sessionId;
        if (!sessionId) {
            // Should never happen, but if it does, we must not spawn the worker.
            throw `sessionId is required for starting the sync worker`;
        }

        const workerId = `sync-${sessionId}`;
        this._workerProxy = new WorkerProxy(makeSyncWorker(workerId) as SharedWorker);
        this._eventBus = new EventBus(workerId);
        this._eventBus.setListener(SyncEvent.StatusChanged, this.onStatusChanged.bind(this));
        this._eventBus.setListener(SyncEvent.SyncChanges, this.onSyncChanges.bind(this));

        this._session.sendQueuePool.on("pendingEvent", this.onPendingEvent.bind(this));
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
        this._status.set(response.data.syncStatus);
        if (response?.error) {
            throw response.error;
        }
    }

    stop(): void {
        // TODO
    }

    // Notify worker of a pending event.
    private async onPendingEvent(pendingEvent: PendingEvent) {
        const {data} = pendingEvent;
        const request: AddPendingEventRequest = {
            id: makeRequestId(),
            type: SyncRequestType.AddPendingEvent,
            data: {
                pendingEvent: data,
            }
        };

        const response = await this._workerProxy.sendAndWaitForResponse(request) as AddPendingEventResponse;
        if (response?.error) {
            throw response.error;
        }
    }

    private onStatusChanged(event: SyncStatusChanged): void {
        this._status.set(event.data.newValue);
    }

    private async onSyncChanges(event: SyncChanges): Promise<void> {
        const sessionChanges = event.data.session;
        const roomsChanges = event.data.rooms;
        const isInitialSync = event.data.syncStatus === SyncStatus.InitialSync;

        if (isInitialSync) {
            // For the initial sync, instead of handling sync changes, we simply reload.
            location.reload();
            return;
        }

        await this._logger.run("sync changes", async log => {
            await log.wrap("session", log => {
                log.log({l: "changes", ...sessionChanges});
                const deserializedSessionChanges = deserializeSessionChanges(sessionChanges);
                this._session.afterSync(deserializedSessionChanges.changes, log);
            });

            await log.wrap("rooms", log => {
                const rooms: ObservableMap<string, Room> = this._session.rooms;
                for (const roomChanges of roomsChanges) {
                    const {roomId, changes} = roomChanges;
                    log.log({l: roomId, ...changes});

                    const room = rooms.get(roomId);
                    const deserializedRoomChanges = deserializeRoomChanges(room, roomChanges);

                    room.sendQueue.removePendingEvents(deserializedRoomChanges.changes.removedPendingEvents);
                    // We already removed pending events, so we don't want room.afterSync() to try to remove them again.
                    // So we set the removedPendingEvents array to empty.
                    deserializedRoomChanges.changes.removedPendingEvents = [];
                    room.afterSync(deserializedRoomChanges.changes, log);
                }
            });
        });
    }
}
