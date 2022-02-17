const { EventEmitter, errorMonitor } = require('events');
const StatusToInProgressListener = require('./StatusToInProgressListener')

class TicketStatusEventEmitter extends EventEmitter {}

const statusToInProgressListener = new StatusToInProgressListener();
const ticketStatusEventEmitter = new TicketStatusEventEmitter();

ticketStatusEventEmitter.on(errorMonitor, (err) => {
    console.error(err);
});

ticketStatusEventEmitter.on('statusChanged:inProgress', (requestPayload) => {
    console.log('statusChanged:inProgress event occurred!');
    statusToInProgressListener.react(requestPayload);
});

module.exports.ticketStatusEventEmitter = ticketStatusEventEmitter;
