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

import {SyncWorker} from "./SyncWorker";
import assetPaths from "../../web/sdk/paths/vite";

declare const self;

// Vite makes the paths relative (e.g. ./assets/olm.abc123.js) but we want the absolute path, so we strip the
// leading `.`.
// TODO: Fix this at vite level.
const olmWasmJsPath = assetPaths.olm.wasmBundle.substring(1);
const olmWasmPath = assetPaths.olm.wasm.substring(1);

self.syncWorker = new SyncWorker({
    assets: {
        olmWasmJsPath: olmWasmJsPath,
        olmWasmPath: olmWasmPath,
    }
});
