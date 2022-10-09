import { REST, Routes } from 'discord.js';
import fs from 'node:fs/promises';
import { InvalidCommandError, PegasusError } from '../utility/errors.def.js';
import LogService from '../utility/log.service.js';

const SlashSuffix = '.slash.js';
const InteractionsPath = './lib/interactions';

const slashes = [];
const log = new LogService('slash.service.js');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT;
const guildId = process.env.DISCORD_GUILD;
const rest = new REST({ version: '10' }).setToken(token);

async function loadSlashModules() {
    const _interactionFiles = await fs.readdir(InteractionsPath);
    const _slashFiles = _interactionFiles
        .filter(file => file.endsWith(SlashSuffix))
        .map(file => './' + file);

    slashes.filter(() => false);

    for (const file of _slashFiles) {
        try {
            let slash = (await import(file)).default;

            slashes.push(slash);

            log.trace(`Loaded slash module "${slash.data.name}" (version ${slash.data.version})`);
        } catch (e) {
            log.warn(`Failed to load slash module "${file}": ${e.message || e}`);
        }
    }

    log.debug(`Loaded ${slashes.length} slash modules in total`);
}

async function announceCommands() {
    try {
        log.trace(`Pushing app command refresh...`);

        const commands = slashes.map(slash => slash.data);
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        log.debug(`Successfully pushed ${data.length} app commands`);
    } catch (e) {
        log.error(e);
    }
}

export async function LoadAndAnnounce() {
    await loadSlashModules();
    await announceCommands();
}

export async function HandleInboundInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    try {
        for (let slash of slashes) {
            if (interaction.commandName === slash.data.name) {
                await slash.handle(interaction);

                break;
            }
        }
    } catch (e) {
        if (e instanceof InvalidCommandError) {
            interaction.reply(e.message);

            return;
        }

        log.error(`Error during interaction ${interaction.id}: ${e.message || e}`);
        interaction.reply(`I'm sorry, but there was a problem handling the command.`);
    }
}