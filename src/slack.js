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

function prepareRequestPayload(ticket, ticketCreatedResponse) {
    const summary = ticket.fields.summary;
    const description = ticket.fields.description ?? EMPTY_FIELD_DISPLAY_VALUE;
    const teamTicketKey = ticketCreatedResponse.key;

    return JSON.stringify({
        channel: SLACK_CHANNEL,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Ticket <https://" + JIRA_DNS + '/browse/' + ticket.key + "|" + ticket.key + "> with summary: \"" + summary + "\" was created.",
                }
            }
        ]
    });
}

function notifyTicketCreated(ticketRequest, ticketCreatedResponse) {
    console.debug('notifyTicketCreated');
    const ticket = ticketRequest.body.issue;
    const requestData = prepareRequestPayload(ticket, ticketCreatedResponse);
    console.debug('notifyTicketCreated requestData');
    console.debug(requestData);
    const options = {
        hostname: 'slack.com',
        port: 443,
        path: '/api/chat.postMessage',
        method: 'POST',
        headers: {
            'Authorization': prepareAuthorizationHeader(),
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    console.log(options);

    const req = https.request(options, res => {
        let responseData = '';
        res.on('data', function (chunk) {responseData += chunk;});
        res.on('end', function () {
            console.debug('notifyTicketCreated end started');
            console.debug('status code:' + res.statusCode);
            console.debug(responseData);
            const responseJson = JSON.parse(responseData);
            if (!responseJson.ok) {
                throw new SlackResponseError(responseJson.error);
            }

            // return responseJson;
            console.debug('end ended');
        });
        console.debug('notifyTicketCreated https.request end');
    });

    req.on('error', error => {
        console.error('notifyTicketCreated error');
        console.error('status code:' + error.statusCode);
        console.error(error.message);
        throw new SlackResponseError(error.message);
    });

    console.log('req.write(requestData)');
    req.write(requestData);
    console.log('req.write done');
    req.end();
    console.debug('notifyTicketCreated req.end()');
}

module.exports.notifyTicketCreated = (ticketRequest, ticketCreatedResponse) => notifyTicketCreated(ticketRequest, ticketCreatedResponse);
