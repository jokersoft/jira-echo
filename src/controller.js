const AUTHORIZATION_ENABLED = process.env.AUTHORIZATION_ENABLED;
const VERSION = process.env.JIRA_ECHO_VERSION ?? 'unknown';

const https = require('https');
const express = require('express');
const auth = require('./auth');
const ticketCreator = require('./ticket-creator');
const issueStatus = require('./issue-status');
const slack = require('./slack');

const authMiddleware = (req, res, next) => {
    console.log('authMiddleware hit');
    const { authorization } = req.headers;
    let expectedAuthHeaderValue = auth.prepareAuthorizationHeader();

    if (AUTHORIZATION_ENABLED == 0) {
        console.debug('AUTHORIZATION DISABLED!');
        next();
    } else if (req.query.authorization && decodeURIComponent(req.query.authorization).includes(expectedAuthHeaderValue)) {
        console.debug('jira-echo query authorization passed');
        next();
    } else if (authorization && authorization.includes(expectedAuthHeaderValue)) {
        console.debug('jira-echo header authorization passed');
        next();
    } else {
        console.log('forbidden');
        res.sendStatus(403);
    }
};

function gateway() {
    const router = express.Router();
    router.post('/issue-created', (request, response) => {
        console.debug('createTicket attempt');
        ticketCreator.createTicket(request, function (err, ticketCreateResult) {
            slack.notifyTicketCreated(request, ticketCreateResult);
        });
        response.status(201).send('{"createTicket":"OK","version":"' + VERSION + '"}');
    });

    router.post('/issue-updated', (request, response) => {
        console.debug('updateTicket attempt');
        issueStatus.update(request, function (err, issueStatusUpdateResult) {
            slack.notifyTicketUpdated(request, issueStatusUpdateResult);
        });
        response.status(200).send('{"ticketStatusUpdate":"OK","version":"' + VERSION + '"}');
    });

    router.get('/webhooks', (request, response) => {
        listWebhooks(request, response);
    });

    router.get('/health', (request, response) => {
        health(request, response);
    });

    return router;
}

function listWebhooks(globalRequest, globalResponse) {
    const options = {
        hostname: auth.getJiraDns,
        port: auth.getJiraPort,
        path: '/rest/webhooks/1.0/webhook/',
        method: 'GET',
        headers: {
            'Authorization': auth.prepareAuthorizationHeader(),
            'Accept': 'application/json',
        }
    }
    const req = https.request(options, res => {
        let responseData = '';
        res.on('data', function (chunk) {responseData += chunk;});
        res.on('end', function () {
            //TODO: format webhooks nice
            return globalResponse.status(res.statusCode).send(responseData);
        });
    })

    req.on('error', error => {
        return globalResponse.status(500).send(error.message);
    })

    req.end()
}

function health(request, response) {
    response.status(200).send('{"status":"OK","version":"' + VERSION + '"}');
}

module.exports.health = (request, response) => health(request, response);
module.exports.gateway = gateway;
module.exports.authMiddleware = authMiddleware;
