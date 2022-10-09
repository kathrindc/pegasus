import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { InvalidCommandError } from '../utility/errors.def.js';
import { formatDuration, formatByteSize } from '../utility/fmt.def.js';
import fs from 'node:fs/promises';
import os from 'node:os';

const packageInfo = await (async () => {
    let content = (await fs.readFile('./package.json')).toString();
    
    return JSON.parse(content);
})();

const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Retrieves information about users, pegasus or the server')
    .addSubcommand(subcommand =>
        subcommand
            .setName('bot')
            .setDescription('Get info about pegasus'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('host')
            .setDescription('Get info about the bot host'))
    .toJSON();

data.version = 1;

async function handle(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let handler = null;

    switch (subcommand) {
        case 'bot': {
            handler = handleBot;
        } break;

        case 'host': {
            handler = handleHost;
        } break;

        default: throw new InvalidCommandError();
    }

    if (typeof (handler) === 'function') {
        await handler(interaction);
    }
}

async function handleBot(interaction) {
    const uptime = formatDuration(process.uptime());

    const infoEmbed = new EmbedBuilder()
        .setColor(0xb254ff)
        .setTitle('Info: Pegasus Bot')
        .setURL('https://github.com/kathrindc/pegasus')
        .setDescription('Pegasus multi-purpose bot')
        .addFields(
            { name: 'Version', value: packageInfo.version, inline: true },
            { name: 'Uptime', value: uptime, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
}

async function handleHost(interaction) {
    const cpuCores = os.cpus();
    const ram = formatByteSize(os.totalmem());
    const processor = `${cpuCores[0].model} x${cpuCores.length}`;
    const uptime = formatDuration(os.uptime());

    const infoEmbed = new EmbedBuilder()
        .setColor(0xb254ff)
        .setTitle('Info: Bot Host')
        .addFields(
            { name: 'Processor', value: processor },
            { name: 'Total RAM', value: ram },
            { name: 'Uptime', value: uptime },
        )
        .setTimestamp();

    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
}

export default { data, handle };