import {SyncWorker} from "./SyncWorker";

const worker = new SyncWorker();
worker.init().then(() => worker.start());
self.syncWorker = worker;
