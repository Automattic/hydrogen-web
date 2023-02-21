import {SyncWorker} from "./SyncWorker";

const worker = new SyncWorker();
worker.start();
self.syncWorker = worker;
