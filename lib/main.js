import { Client, GatewayIntentBits } from 'discord.js';
import { LoadAndAnnounce, HandleInboundInteraction } from './interactions/slash.service.js';
import { InitialiseDatabase } from './persistance/dbinit.service.js';
import ClientService from './utility/client.service.js';
import LogService from './utility/log.service.js';

const log = new LogService('main.js');
const clientService = new ClientService();

log.trace('Starting...');

const token = (() => {
    let ev = process.env.DISCORD_TOKEN;

    if (!ev) {
        log.fatal('DISCORD_TOKEN env variable must be set');
    }

    return ev;
})();
const app = (() => {
    let ev = process.env.DISCORD_CLIENT;

    if (!ev) {
        log.fatal('DISCORD_CLIENT env variable must be set');
    }

    return ev;
})();
const guild = (() => {
    let ev = process.env.DISCORD_GUILD;

    if (!ev) {
        log.fatal('DISCORD_GUILD env variable must be set');
    }

    return ev;
})();
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

log.debug(`Running under app id ${app}`);
log.debug(`Primary guild set to ${guild}`);

client.once('ready', () => {
    log.info(`Bot is logged in and ready`);
});

client.on('interactionCreate', interaction => HandleInboundInteraction(interaction));

const registerExitSignals = (...signals) => {
    for (let signal of signals) {
        process.on(signal, () => {
            process.stdout.write('\n');
            log.debug(`Main process received ${signal}`);
            log.info(`Shutting down...`);

            client.destroy();
            process.exit(0);
        });
    }
}

registerExitSignals('SIGINT', 'SIGTERM');

process.on('SIGUSR1', async () => {
    log.debug('Main process received SIGUSR1');

    await LoadAndAnnounce();
});

export default async function exec() {
    client.login(token);
    clientService.set(client);

    await InitialiseDatabase();
    await LoadAndAnnounce();
}
