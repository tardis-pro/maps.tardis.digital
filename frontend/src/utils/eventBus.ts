import { BroadcastChannel } from 'broadcast-channel';
import { getUnixTime } from 'date-fns';


class EventBus {
    globalListenChannel: BroadcastChannel;
    globalEmitChannel: BroadcastChannel;

    emitChannel: BroadcastChannel;
    listenChannel: BroadcastChannel;
    constructor() {
        this.reset();
        this.globalListenChannel = new BroadcastChannel('global');
        this.globalEmitChannel = new BroadcastChannel('global');
        window.globalChannel = this.globalChannel;
    }

    /** reset event bus */
    reset() {
        const now = getUnixTime(new Date());
        const busName = `bus-${now}`;
        this.emitChannel = new BroadcastChannel(busName);
        this.listenChannel = new BroadcastChannel(busName);
    }

    /**
     * Emit an event
     * @param {String} event event type
     * @param {Object} data event payload
     * @param {Object} bus selects which bus should be used for emiting(emitChannel/globalChannel)
     */
    emit(event, data, bus = 'emitChannel') {
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
     * @param {String} targetEvent event type
     * @param {Function} handler event handler function
     */
    on(targetEvent, handler, bus = 'listenChannel') {
        const proxyFunc = (eventObj) => {
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
     * @param {String} targetEvent event type
     * @param {Function} handler event handler function
     */
    off(targetEvent, handler) {
        this.listenChannel.removeEventListener(targetEvent, handler);
    }
}

export default new EventBus();
