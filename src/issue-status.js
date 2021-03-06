const https = require('https');
const auth = require('./auth');
const { issueStatusChangeEventEmitter } = require('./issueStatus/IssueStatusChangeEventEmitter.js');

class JiraIssueUpdateError extends Error {
    constructor(message) {
        super(message);
        this.name = "JiraIssueUpdateError";
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
        throw new JiraIssueUpdateError('Wrong eventType!');
    }

    // Start status specific logics
    let statusFrom, statusTo;

    // get status change
    for (const changeRecord of changelogItems) {
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

    issueStatusChangeEventEmitter.emit('IssueUpdated', requestPayload, callback);
}

module.exports.update = update;
