import LogService from './log.service.js';

let _instance;

const log = new LogService('client.service.js');

export default class ClientService {
    constructor() {
        if (!_instance) {
            _instance = null;
        }
    }

    set(instance) {
        if (_instance) {
            log.error('Cannot override existing client instance');
            return;
        }

        _instance = instance;
    }

    get() {
        return _instance;
    }

    async send(channelId, message) {
        let channel = await _instance.channels.cache.get(`${channelId}`);

        channel.send(message);

        log.trace(`Sent message to #${channelId}: ${typeof (message) === 'string' ? message : JSON.stringify(message)}`);
    }

    get isReady() {
        return _instance && true;
    }
}