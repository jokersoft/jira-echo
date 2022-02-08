const https = require('https');
const auth = require('./auth');

class JiraTicketUpdateError extends Error {
    constructor(message) {
        super(message);
        this.name = "JiraTicketUpdateError";
    }
}

function getRelatedTicketKey(ticketKey) {
    // TODO: implement
    return 'BS-2';
}

function update(request, callback) {
    // TODO: implement
}

module.exports.update = update;
