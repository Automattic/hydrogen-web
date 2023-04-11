import {Event, EventType} from "../../workers/types/base";

type Listener = (event: Event) => void;
type ListenerMap = Map<EventType, Listener>;

export class EventBus {
    private readonly _listeners: ListenerMap = new Map;
    private readonly _channel: BroadcastChannel;

    constructor(id: string) {
        this._channel = new BroadcastChannel(id);
        this._channel.onmessage = this.onMessage.bind(this);
    }

    setListener(type: EventType, listener: Listener) {
        if (this._listeners.has(type)) {
            throw `A listener for events of type ${type} is already set`;
        }
        this._listeners.set(type, listener);
    }

    onMessage(message: MessageEvent) {
        const event = message.data as Event;
        const listener = this._listeners.get(event.type);
        if (!listener) {
            return;
        }
        listener(event);
    }
}
