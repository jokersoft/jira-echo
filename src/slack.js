const EMPTY_FIELD_DISPLAY_VALUE = 'empty';

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const JIRA_DNS = process.env.JIRA_DNS;

const https = require('https');

class SlackResponseError extends Error {
    constructor(message) {
        super(message);
        this.name = "SlackResponseError";
    }
}

function prepareAuthorizationHeader() {
    return 'Bearer ' + SLACK_TOKEN;
}

function prepareTicketCreatedRequestPayload(ticket, ticketCreatedResponse) {
    const summary = ticket.fields.summary;

    return JSON.stringify({
        channel: SLACK_CHANNEL,
        as_user: false,
        icon_emoji: ":rick-happy:",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Ticket <https://" + JIRA_DNS + '/browse/' + ticket.key + "|" + ticket.key + "> with summary: \"" + summary + "\" was reported in Service Desk.\n" +
                    "Related ticket <https://" + JIRA_DNS + '/browse/' + ticketCreatedResponse.key + "|" + ticketCreatedResponse.key + "> autogenerated.",
                }
            }
        ]
    });
}

function prepareTicketUpdatedRequestPayload(ticketRequest) {
    const ticket = ticketRequest.body.issue;

    return JSON.stringify({
        channel: SLACK_CHANNEL,
        as_user: false,
        icon_emoji: ":rick-happy:",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Ticket <https://" + JIRA_DNS + '/browse/' + ticket.key + "|" + ticket.key + "> status updated (" + ticket.fields.status.name + ")",
                }
            }
        ]
    });
}

function notifySlack(text) {
    const options = {
        hostname: 'slack.com',
        port: 443,
        path: '/api/chat.postMessage',
        method: 'POST',
        headers: {
            'Authorization': prepareAuthorizationHeader(),
            'Content-Type': 'application/json',
            'Content-Length': text.length
        }
    }

    const req = https.request(options, res => {
        let responseData = '';
        res.on('data', function (chunk) {responseData += chunk;});
        res.on('end', function () {
            console.debug('status code: ' + res.statusCode);
            const responseJson = JSON.parse(responseData);
            if (!responseJson.ok) {
                throw new SlackResponseError(responseJson.error);
            }
        });
    });

    req.on('error', error => {
        console.error('notifyTicketCreated error');
        console.error('status code:' + error.statusCode);
        console.error(error.message);
        throw new SlackResponseError(error.message);
    });

    req.write(text);
    req.end();
}

function notifyTicketCreated(ticketRequest, ticketCreatedResponse) {
    const ticket = ticketRequest.body.issue;
    const requestData = prepareTicketCreatedRequestPayload(ticket, ticketCreatedResponse);
    notifySlack(requestData);
}

function notifyTicketUpdated(ticketRequest) {
    const requestData = prepareTicketUpdatedRequestPayload(ticketRequest);
    notifySlack(requestData);
}

function notifyError(error) {
    //TODO: use it!
    console.error('slacking error');
    console.error(error);
}

module.exports.notifyTicketCreated = (ticketRequest, ticketCreatedResponse) => notifyTicketCreated(ticketRequest, ticketCreatedResponse);
module.exports.notifyTicketUpdated = (ticketRequest) => notifyTicketUpdated(ticketRequest);
module.exports.notifyError = (error) => notifyError(error);
