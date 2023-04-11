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
import {Sync} from "../../../matrix/Sync";
import {RequestScheduler} from "../../../matrix/net/RequestScheduler";
import {Session} from "../../../matrix/Session";
import {Logger} from "../../../logging/Logger";
import {Storage} from "../../../matrix/storage/idb/Storage";
import {FeatureSet} from "../../../features";
import {SyncProxy} from "./SyncProxy";
import {HomeServerApi} from "../../../matrix/net/HomeServerApi";

type Options = {
    logger: Logger;
    runSyncInWorker: boolean;
}

type MakeOptions = {
    hsApi: HomeServerApi;
    storage: Storage;
    session: Session;
}

export class SyncFactory {
    private readonly _logger: Logger;
    private readonly _runSyncInWorker: boolean;

    constructor(options: Options) {
        const {logger, runSyncInWorker} = options;
        this._logger = logger;
        this._runSyncInWorker = runSyncInWorker;
    }

    make(options: MakeOptions): ISync {
        const {hsApi, storage, session} = options;

        if (this._runSyncInWorker) {
            return new SyncProxy({session, logger: this._logger});
        }

        return new Sync({
            logger: this._logger,
            hsApi: hsApi,
            storage,
            session,
        });
    }
}
