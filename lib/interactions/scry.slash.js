import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import Scryfall from '../integrations/scryfall.js';
import { InvalidCommandError } from '../utility/errors.def.js';

const commandData = new SlashCommandBuilder()
    .setName('scry')
    .setDescription('Utility commands for playing Magic online')
    .addSubcommand(subcommand =>
        subcommand
            .setName('card')
            .setDescription('Searches for a card by it\'s name')
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the card')
                    .setRequired(true)
                    .setMinLength(3)))
    .toJSON();

commandData.version = 1;

async function handleCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let handler = null;

    switch (subcommand) {
        case 'card': {
            handler = _searchCard;
        } break;

        default: throw new InvalidCommandError();
    }

    if (typeof (handler) === 'function') {
        await handler(interaction);
    }
}

async function _searchCard(interaction) {
    const name = interaction.options.getString('name');
    const [ card ] = await Scryfall.searchCard(name);

    if (card) {
        const embed = new EmbedBuilder()
            .setColor(0xb94426)
            .setTitle(card.name)
            .setImage(card.image_uris.png)
            .setTimestamp()
            .setURL(card.scryfall_uri)
            .setDescription(`**Set:** ${card.set_name}\n**Price:** N ${card.prices.eur}€ / F ${card.prices.eur_foil}€`);

        interaction.reply({ embeds: [embed] });
    } else {
        interaction.reply({ content: 'Sorry, but I could not find any cards with that name.', ephemeral: true });
    }
}

export default {
    handleCommand,
    commandData,
}
