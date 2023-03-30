import {SendQueue} from "./room/sending/SendQueue";
import {EventEmitter} from "../utils/EventEmitter";
import {HomeServerApi} from "./net/HomeServerApi";
import {Storage} from "./storage/idb/Storage";

type RoomId = string;

type Options = {
    storage: Storage,
    hsApi: HomeServerApi,
}

export class SendQueuePool extends EventEmitter<any> {
    private readonly _queues: Map<RoomId, SendQueue> = new Map;
    private readonly _storage: Storage;
    private readonly _hsApi: HomeServerApi;

    constructor(options: Options) {
        super();
        const {storage, hsApi} = options;
        this._storage = storage;
        this._hsApi = hsApi;
    }

    createQueue(roomId: RoomId, pendingEvents: []): SendQueue {
        const sendQueue = new SendQueue({roomId, storage: this._storage, hsApi: this._hsApi, pendingEvents});
        sendQueue.on("pendingEvent", event => this.emit("pendingEvent", event));
        this._queues.set(roomId, sendQueue);
        return sendQueue;
    }
}
