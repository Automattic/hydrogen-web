import {SyncWorker} from "./SyncWorker";

const worker = new SyncWorker();
void worker.start();
self.syncWorker = worker;
