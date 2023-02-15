class SyncWorker {
    constructor() {
        self.addEventListener("message", this.onMessage);
    }

    private onMessage(event: MessageEvent<string>) {
        console.log(event)
        const data = event.data;
        console.log(data);
        postMessage(data);
    }
}

// @ts-ignore
self.syncWorker = new SyncWorker();
