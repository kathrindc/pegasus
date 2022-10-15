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
        if (channelId) {
            let channel = await _instance.channels.fetch(`${channelId}`);

            await channel.send(message);

            log.trace(`Sent message to #${channelId}: ${typeof (message) === 'string' ? message : JSON.stringify(message)}`);
        } else {
            log.warn(`ClientService.send was called with an invalid channelId (${channelId})`);
        }
    }

    async edit(channelId, messageId, data) {
        let channel = await _instance.channels.fetch(`${channelId}`);
        let message = await channel.messages.fetch(`${messageId}`);

        await message.edit(data);

        log.trace(`Edited message in #${message.channel.id}: Changed ${Object.keys(data).join(', ')} attribute(s)`);
    }

    async user(id) {
        const guild = await _instance.guilds.fetch(process.env.DISCORD_GUILD);
        const guildUser = await guild.members.fetch(id);

        if (guildUser) {
            return guildUser;
        }

        return await _instance.users.fetch(id);
    }

    get isReady() {
        return _instance && true;
    }
}