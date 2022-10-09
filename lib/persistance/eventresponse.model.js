import Sequelize from 'sequelize';
import database from './database.def.js';
import Events from './event.model.js';

const EventResponses = database.define('event_responses', {
    userId: {
        field: 'user_id',
        type: Sequelize.STRING,
        allowNull: false,
    },
    state: {
        type: Sequelize.ENUM,
        values: ['Denied', 'Accepted', 'Tentative'],
        allowNull: false,
    }
});

EventResponses.belongsTo(Events, {
    foreignKey: 'event_id',
});

export default EventResponses;
