const https = require('https');
const auth = require('./auth');
const { ticketStatusEventEmitter } = require('./ticketStatus/TicketStatusEventEmitter.js');

class JiraTicketUpdateError extends Error {
    constructor(message) {
        super(message);
        this.name = "JiraTicketUpdateError";
    }
}

function getRelatedTicketKey(ticket) {
    // TODO: implement
    return 'BS-2';
}

function supports(request) {
    const eventType = request.body.webhookEvent

    if (eventType !== 'jira:issue_updated') {
        console.debug('unsupported eventType: ' + eventType);
        return false;
    }

    const changelogItems = request.body.changelog.items;

    for (const changelogItem of changelogItems) {
        if (changelogItem.field === 'status') {
            return true;
        }
    }

    return false;
}

function update(request, callback) {
    console.debug('Ticket-status update triggered.');

    if (!supports(request)) {
        return;
    }

    // parse info about updated ticket
    const requestPayload = request.body;
    const eventType = requestPayload.webhookEvent
    const changelogItems = requestPayload.changelog.items;

    console.debug('eventType: ' + eventType);

    if (eventType !== 'jira:issue_updated') {
        console.error('Wrong eventType!');
        throw new JiraTicketUpdateError('Wrong eventType!');
    }

    let statusFrom, statusTo;

    //get status change
    for (const changeRecord of changelogItems) {
        console.log('changeRecord');
        console.log(changeRecord);
        if (changeRecord.field === 'status') {
            statusFrom = changeRecord.from;
            statusTo = changeRecord.to;
            break;
        }
    }

    if (!statusFrom || !statusTo) {
        console.warn('No status update in the changelog!');
        return;
    }

    ticketStatusEventEmitter.emit('statusChanged:inProgress', requestPayload);
}

module.exports.update = update;
