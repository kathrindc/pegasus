import Sequelize from 'sequelize';
import database from './database.def.js';

const Events = database.define('events', {
    organiserId: {
        field: 'organiser_id',
        type: Sequelize.STRING,
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    scheduledStart: {
        field: 'scheduled_start',
        type: Sequelize.DATE,
        allowNull: false,
    },
    scheduledEnd: {
        field: 'scheduled_end',
        type: Sequelize.DATE,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
    },
    location: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

export default Events;
