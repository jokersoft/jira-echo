const AUTHORIZATION_ENABLED = process.env.AUTHORIZATION_ENABLED;
const DEFAULT_JIRA_PORT = 443;
const DEFAULT_JIRA_DNS = 'jira-echo.requestcatcher.com';
const DEFAULT_PROJECT_ID = 10545;
const DEFAULT_ISSUE_TYPE_ID = 10004;
const JIRA_DNS = process.env.JIRA_DNS ?? DEFAULT_JIRA_DNS;
const JIRA_PORT = process.env.JIRA_PORT ?? DEFAULT_JIRA_PORT;
const PROJECT_ID = process.env.PROJECT_ID ?? DEFAULT_PROJECT_ID;
const ISSUE_TYPE_ID = process.env.ISSUE_TYPE_ID ?? DEFAULT_ISSUE_TYPE_ID;

const https = require('https');
const express = require('express');

const authMiddleware = (req, res, next) => {
    console.log('authMiddleware hit');
    const { authorization } = req.headers;
    let expectedAuthHeaderValue = prepareAuthorizationHeader();

    if (AUTHORIZATION_ENABLED == 0) {
        console.debug('AUTHORIZATION DISABLED!');
        next();
    } else if (authorization && authorization.includes(expectedAuthHeaderValue)) {
        console.debug('jira-echo authorization passed');
        next();
    } else {
        console.log('forbidden');
        res.sendStatus(503);
    }
};

function prepareAuthorizationHeader() {
    return 'Basic ' + Buffer.from(process.env.JIRA_USER + ':' + process.env.JIRA_TOKEN).toString('base64');
}

function gateway() {
    const router = express.Router();
    router.post('/ticket-created', (request, response) => {
        console.debug('createTicket attempt');
        createTicket(request, response);
        //TODO: alert ticket creation
    });

    router.get('/webhooks', (request, response) => {
        listWebhooks(request, response);
    });

    router.get('/health', (request, response) => {
        health(request, response);
    });

    return router;
}

function createTicket(globalRequest, globalResponse) {
    // parse info about created ticket
    let eventType = globalRequest.body.webhookEvent
    let ticket = globalRequest.body.issue;
    let summary = ticket.fields.summary;
    let description = ticket.fields.description;

    console.debug('eventType: ' + eventType);
    console.debug('id: ' + ticket.id);
    console.debug('key: ' + ticket.key);
    console.debug('issue type: ' + ticket.fields.issuetype.name);
    console.debug('issue status: ' + ticket.fields.status.name);
    console.debug('project: ' + ticket.fields.project.name);
    console.debug('summary: ' + summary);
    console.debug('description: ' + description);

    // prepare request
    let ticketRequest = {
        fields: {
            project:
                {
                    id: PROJECT_ID
                },
            summary: summary,
            description: 'this is an automatically created ticket',
            issuetype: {
                id: ISSUE_TYPE_ID
            }
        }
    };

    const { authorization } = globalRequest.headers;
    const requestData = JSON.stringify(ticketRequest);
    const options = {
        hostname: JIRA_DNS,
        port: JIRA_PORT,
        path: '/rest/api/2/issue/',
        method: 'POST',
        headers: {
            'Authorization': authorization ?? null,
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    console.debug('requestData');
    console.debug(requestData);
    console.debug('options');
    console.debug(options);

    const req = https.request(options, res => {
        let responseData = '';
        res.on('data', function (chunk) {responseData += chunk;});
        res.on('end', function () {
            console.debug('createTicket success');
            console.debug('responseData');
            console.debug(responseData);
            return globalResponse.status(res.statusCode).send(responseData);
        });
    })

    req.on('error', error => {
        console.error('createTicket error');
        console.error(error.message);
        return globalResponse.status(500).send(error.message);
    })

    req.write(requestData)
    req.end()
}

function listWebhooks(globalRequest, globalResponse) {
    const options = {
        hostname: JIRA_DNS,
        port: JIRA_PORT,
        path: '/rest/webhooks/1.0/webhook/',
        method: 'GET',
        headers: {
            'Authorization': prepareAuthorizationHeader(),
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
    response.status(200).send('{"status":"OK"}');
}

module.exports.health = (request, response) => health(request, response);
module.exports.gateway = gateway;
module.exports.authMiddleware = authMiddleware;
