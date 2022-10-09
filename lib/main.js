import { Client, GatewayIntentBits } from 'discord.js';
import LogService from './utility/log.service.js';

const log = new LogService('main.js');

log.debug('Starting...');

const token = (() => {
    let ev = process.env.DISCORD_TOKEN;

    if (!ev) {
        log.fatal('DISCORD_TOKEN env variable must be set');
    }

    return ev;
})();
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    log.info(`Bot is logged in and ready`);
});

process.on('SIGINT', () => {
    console.log();
    log.warn('Caught SIGINT, shutting down...');

    client.destroy();
    process.exit(0);
});

export default function exec() {
    client.login(token);
}
