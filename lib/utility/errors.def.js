export class PegasusError extends Error {
    constructor(message) {
        super(message);
    }
}

export class InvalidCommandError extends PegasusError {
    constructor() {
        super('Invalid command');
    }
}
