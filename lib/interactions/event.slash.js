import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import Events from '../persistance/event.model.js';
import { InvalidCommandError } from '../utility/errors.def.js';
import ClientService from '../utility/client.service.js';
import AlarmService from '../utility/alarm.service.js';
import EventResponses from '../persistance/eventresponse.model.js';

const clientService = new ClientService();
const alarmService = new AlarmService();

const commandData = new SlashCommandBuilder()
    .setName('events')
    .setDescription('Allows you to manage events and their attendences')
    .addSubcommand(subcommand =>
        subcommand
            .setName('plan')
            .setDescription('Plan a new event and send an invitation to everyone'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all currently registered events'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('cancel')
            .setDescription('Cancel an existing event and notify attendees'))
    .toJSON();

commandData.version = 1;

async function handleCommand(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let handler = null;

    switch (subcommand) {
        case 'plan': {
            handler = _openPlanModal;
        } break;

        case 'list': {
            handler = handleList;
        } break;

        case 'cancel': {
            handler = handleCancel;
        } break;

        default: throw new InvalidCommandError();
    }

    if (typeof (handler) === 'function') {
        await handler(interaction);
    }
}

async function handleModal(interaction) {
    let handler = null;

    switch (interaction.customId) {
        case 'create-plan': {
            handler = _planEvent;
        } break;

        default: return;
    }

    if (typeof (handler) === 'function') {
        await handler(interaction)
    }
}

async function handleButton(interaction) {
    let handler = null;

    switch (interaction.customId) {
        case 'accept-event': {
            handler = _acceptEvent;
        } break;

        case 'reject-event': {
            handler = _rejectEvent;
        } break;

        default: return;
    }

    if (typeof (handler) === 'function') {
        await handler(interaction);
    }
}

async function _openPlanModal(interaction) {
    const titleInput = new TextInputBuilder()
        .setCustomId('event-title')
        .setLabel('Title')
        .setMinLength(3)
        .setMaxLength(254)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

    const locationInput = new TextInputBuilder()
        .setCustomId('event-location')
        .setLabel('Location')
        .setMinLength(3)
        .setMaxLength(254)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

    const scheduledStartInput = new TextInputBuilder()
        .setCustomId('event-sched-start')
        .setPlaceholder('yyyy-mm-dd HH:MM')
        .setMinLength(15)
        .setMaxLength(16)
        .setRequired(true)
        .setLabel('Scheduled Start')
        .setStyle(TextInputStyle.Short);

    const scheduledEndInput = new TextInputBuilder()
        .setCustomId('event-sched-end')
        .setPlaceholder('yyyy-mm-dd HH:MM')
        .setMinLength(15)
        .setMaxLength(16)
        .setRequired(true)
        .setLabel('Scheduled End')
        .setStyle(TextInputStyle.Short);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('event-description')
        .setLabel('Description')
        .setRequired(false)
        .setMaxLength(254)
        .setStyle(TextInputStyle.Paragraph);

    const modal = new ModalBuilder()
        .setCustomId('create-plan')
        .setTitle('Plan an Event')
        .setComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(locationInput),
            new ActionRowBuilder().addComponents(scheduledStartInput),
            new ActionRowBuilder().addComponents(scheduledEndInput),
            new ActionRowBuilder().addComponents(descriptionInput)
        );

    await interaction.showModal(modal);
}

async function _planEvent(interaction) {
    const scheduledStart = new Date(interaction.fields.getTextInputValue('event-sched-start')); 
    const scheduledEnd = new Date(interaction.fields.getTextInputValue('event-sched-end')); 

    let event = await Events.create({
        organiserId: interaction.user.id,
        title: interaction.fields.getTextInputValue('event-title'),
        location: interaction.fields.getTextInputValue('event-location'),
        description: interaction.fields.getTextInputValue('event-description'),
        scheduledStart, scheduledEnd,
    });

    await alarmService.setAlarm(
        scheduledStart,
        'events',
        JSON.stringify({
            eventId: event.id
        })
    );

    const embed = await _makeEventEmbed(event);
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('accept-event')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('reject-event')
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger)
        );

    try {
        await interaction.reply({ content: '@here', embeds: [embed] });

        const message = await interaction.fetchReply();

        event.channelId = message.channel.id;
        event.messageId = message.id;

        await event.save();
        await clientService.edit(event.channelId, event.messageId, { components: [row] });
    } catch (e) {
        await event.destroy();

        throw e;
    }
}

async function _acceptEvent(interaction) {
    const event = await Events.findOne({
        where: {
            channelId: interaction.channel.id,
            messageId: interaction.message.id
        }
    });

    if (!event) {
        return;
    }

    const existing = await EventResponses.findOne({
        where: {
            eventId: event.id,
            userId: interaction.user.id,
        }
    });

    if (existing) {
        if (existing.state === 'R') {
            existing.state = 'A';

            await existing.save();
            await interaction.reply({ content: `You have changed your response for ${event.title} to *accepted*.`, ephemeral: true });
        } else {
            await interaction.reply({ content: 'You have already accepted the invitation!', ephemeral: true });
        }
    } else {
        await EventResponses.create({
            eventId: event.id,
            userId: interaction.user.id,
            state: 'A',
        });

        await interaction.reply({ content: `You have *accepted* your invitation for ${event.title}`, ephemeral: true });
    }

    setTimeout(() => _updatePosting(event), 1);
}

async function _rejectEvent(interaction) {
    const event = await Events.findOne({
        where: {
            channelId: interaction.channel.id,
            messageId: interaction.message.id
        }
    });

    if (!event) {
        return;
    }

    const existing = await EventResponses.findOne({
        where: {
            eventId: event.id,
            userId: interaction.user.id,
        }
    });

    if (existing) {
        if (existing.state === 'A') {
            existing.state = 'R';
            
            await existing.save();
            await interaction.reply({ content: `You have changed your response for ${event.title} to *rejected*.`, ephemeral: true });
        } else {
            await interaction.reply({ content: 'You have already rejected the invitation!', ephemeral: true });
        }
    } else {
        await EventResponses.create({
            eventId: event.id,
            userId: interaction.user.id,
            state: 'R',
        });

        await interaction.reply({ content: `You have *rejected* your invitation for ${event.title}`, ephemeral: true });
    }

    setTimeout(() => _updatePosting(event), 1);
}

async function _updatePosting(event) {
    const embed = await _makeEventEmbed(event);

    await clientService.edit(event.channelId, event.messageId, { embeds: [embed] });
}

async function _makeEventEmbed(event) {
    const epochStart = Math.floor(new Date(event.scheduledStart).getTime() / 1000);
    const epochEnd = Math.floor(new Date(event.scheduledEnd).getTime() / 1000);
    const responses = await EventResponses.findAll({ where: { eventId: event.id } });
    let attending = [], rejected = [];

    for (let response of responses) {
        const user = await clientService.user(response.userId);
        const state = response.state === 'A';

        (state ? attending : rejected).push(user.displayName || user.nickname || user.username);
    }

    attending = attending.length > 0 ? attending.join(', ') : '*no-one*';
    rejected = rejected.length > 0 ? rejected.join(', ') : '*no-one*';

    const embed = new EmbedBuilder()
        .setColor(0xff00ff)
        .setTitle(`Event: ${event.title}`)
        .setDescription(event.description || 'An event has been planned!')
        .addFields(
            { name: 'Starts at', value: `<t:${epochStart}:R>`, inline: true },
            { name: 'Ends at', value: `<t:${epochEnd}:R>`, inline: true },
            { name: 'Location', value: event.location },
            { name: 'Attending', value: attending, inline: true },
            { name: 'Rejected', value: rejected, inline: true }
        );

    return embed;
}

alarmService.listen('events', async alarm => {
    const data = JSON.parse(alarm.data);
    const event = await Events.findByPk(data.eventId);

    if (event) {
        await clientService.send(event.channelId, `@here Event "${event.title}" is about to start!`);
        await clientService.edit(event.channelId, event.messageId, { components: [] });
    }
});

export default {
    handleCommand,
    handleModal,
    handleButton,
    commandData,
    modals: ['create-plan'],
    buttons: ['accept-event', 'reject-event'],
};
