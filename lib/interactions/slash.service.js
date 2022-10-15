import { DiscordAPIError, REST, Routes } from 'discord.js';
import fs from 'node:fs/promises';
import { InvalidCommandError } from '../utility/errors.def.js';
import LogService from '../utility/log.service.js';
import Logs from '../persistance/log.model.js';

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

    slashes.splice(0, slashes.length);

    for (const file of _slashFiles) {
        try {
            let slash = (await import(file)).default;
            let data = slash.commandData;

            slashes.push(slash);

            log.trace(`Loaded slash module "${data.name}" (version ${data.version})`);
        } catch (e) {
            log.warn(`Failed to load slash module "${file}": ${e.message || e}`);
        }
    }

    log.debug(`Loaded ${slashes.length} slash modules in total`);
}

async function announceCommands() {
    try {
        log.trace(`Pushing app command refresh...`);

        const commands = slashes.map(slash => slash.commandData);
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
    if (interaction.guild.id != guildId) {
        return;
    }

    {
        let success = false;
        let matched = false;

        try {
            for (let slash of slashes) {
                if (interaction.isChatInputCommand()
                    && typeof (slash.handleCommand) === 'function'
                    && interaction.commandName === slash.commandData.name) {
                    matched = true;

                    await slash.handleCommand(interaction);

                    success = true;

                    break;
                }

                if (interaction.isModalSubmit()
                    && typeof (slash.handleModal) === 'function'
                    && slash.modals.includes(interaction.customId)) {
                    matched = true;

                    await slash.handleModal(interaction);

                    success = true;

                    break;
                }

                if (interaction.isButton()
                    && typeof (slash.handleButton) === 'function'
                    && slash.buttons.includes(interaction.customId)) {
                    matched = true;

                    await slash.handleButton(interaction);

                    success = true;

                    break;
                }
            }
        } catch (e) {
            if (e instanceof InvalidCommandError) {
                interaction.reply({ content: e.message, ephemeral: true });

                return;
            }

            if (e instanceof DiscordAPIError) {
                switch (e.code) {
                    case 10062: {
                        log.error(`Check system load, reply to interaction ${interaction.id} timed out!`)
                    } break;

                    default: {
                        log.error(`API error during interaction ${interaction.id}: ${e.message || e}`, e);
                    } break;
                }
                
                return;
            }

            log.error(`Unknown error during interaction ${interaction.id}: ${e.message || e}`, e);

            interaction.reply({ content: `I'm sorry, but there was a problem handling your request.`, ephemeral: true });
        }

        await Logs.create({
            userId: interaction.user.id,
            interactionId: interaction.id,
            commandName: interaction.commandName,
            success, matched
        });
    }
}
