import { BroadcastChannel } from 'broadcast-channel';
import { getUnixTime } from 'date-fns';

// Extend Window interface to include globalChannel
declare global {
    interface Window {
        globalChannel: BroadcastChannel;
    }
}

interface EventMessage {
    timestamp: number;
    event: string;
    data: unknown;
}

type BusType = 'emitChannel' | 'listenChannel' | 'globalChannel';
type EventHandler = (data: unknown) => void;
type ProxyFunction = (eventObj: EventMessage) => void;

class EventBus {
    globalListenChannel!: BroadcastChannel;
    globalEmitChannel!: BroadcastChannel;
    emitChannel!: BroadcastChannel;
    listenChannel!: BroadcastChannel;

    constructor() {
        this.reset();
        this.globalListenChannel = new BroadcastChannel('global');
        this.globalEmitChannel = new BroadcastChannel('global');
        window.globalChannel = this.globalListenChannel;
    }

    /** reset event bus */
    reset(): void {
        const now = getUnixTime(new Date());
        const busName = `bus-${now}`;
        this.emitChannel = new BroadcastChannel(busName);
        this.listenChannel = new BroadcastChannel(busName);
    }

    /**
     * Emit an event
     * @param event event type
     * @param data event payload
     * @param bus selects which bus should be used for emiting(emitChannel/globalChannel)
     */
    emit(event: string, data: unknown, bus: BusType = 'emitChannel'): void {
        console.log({ event, data, bus });
        switch (bus) {
            case 'globalChannel':
                this.globalEmitChannel.postMessage({
                    timestamp: Date.now(),
                    event,
                    data,
                });
                break;
            default:
                this.emitChannel.postMessage({
                    timestamp: Date.now(),
                    event,
                    data,
                });
                break;
        }
    }

    /**
     * Listen to an event
     * @param targetEvent event type
     * @param handler event handler function
     * @param bus selects which bus should be used for listening
     */
    on(
        targetEvent: string,
        handler: EventHandler,
        bus: BusType = 'listenChannel'
    ): ProxyFunction {
        const proxyFunc: ProxyFunction = (eventObj: EventMessage) => {
            if (eventObj.event === targetEvent) {
                handler(eventObj.data);
            }
        };
        switch (bus) {
            case 'globalChannel':
                this.globalListenChannel.addEventListener('message', proxyFunc);
                break;
            default:
                this.listenChannel.addEventListener('message', proxyFunc);
                break;
        }
        return proxyFunc;
    }

    /**
     * Un-listen to an event
     * @param _targetEvent event type (unused but kept for API compatibility)
     * @param handler event handler function
     */
    off(_targetEvent: string, handler: ProxyFunction): void {
        this.listenChannel.removeEventListener('message', handler);
    }
}

export default new EventBus();
