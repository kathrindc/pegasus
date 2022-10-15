import Sequelize from 'sequelize';
import database from './database.def.js';
import Events from './event.model.js';

const EventResponses = database.define('event_responses', {
    userId: {
        field: 'user_id',
        type: Sequelize.STRING,
        allowNull: false,
    },
    eventId: {
        field: 'event_id',
        type: Sequelize.STRING,
        allowNull: false,
    },
    state: {
        type: Sequelize.ENUM,
        values: ['R', 'A'],
        allowNull: false,
    }
});

EventResponses.belongsTo(Events, {
    foreignKey: 'eventId',
});

export default EventResponses;
