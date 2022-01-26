const DEFAULT_JIRA_PORT = 443;
const DEFAULT_JIRA_DNS = 'jira-echo.requestcatcher.com';
const DEFAULT_PROJECT_ID = 10546;
const DEFAULT_ISSUE_TYPE_ID = 10002;
const SECRET = process.env.SECRET;
const JIRA_DNS = process.env.JIRA_URL ?? DEFAULT_JIRA_DNS;
const JIRA_PORT = process.env.JIRA_PORT ?? DEFAULT_JIRA_PORT;
const PROJECT_ID = DEFAULT_PROJECT_ID ?? process.env.PROJECT_ID;
const ISSUE_TYPE_ID = DEFAULT_ISSUE_TYPE_ID ?? process.env.JIRA_URL;

const https = require('https');
const express = require('express');

const authMiddleware = (req, res, next) => {
    next();
    // const { authorization } = req.headers;
    // if (authorization && authorization.includes(SECRET)) {
    //     console.debug('authorization passed');
    //     next();
    // } else {
    //     res.sendStatus(403);
    // }
};

function gateway() {
    const router = express.Router();
    router.post('/ticket-created', (request, response) => {
        createTicket(request, response);
    });

    router.get('/health', (request, response) => {
        health(request, response);
    });

    return router;
}

function createTicket(globalRequest, globalResponse) {
    // parse info about created ticket
    let ticket = globalRequest.body.issue;
    let summary = ticket.fields.summary;
    let description = ticket.fields.description;

    // prepare request
    let ticketRequest = {
        fields: {
            project:
                {
                    id: PROJECT_ID
                },
            summary: summary,
            description: description,
            issuetype: {
                id: ISSUE_TYPE_ID
            }
        }
    };

    const requestData = JSON.stringify(ticketRequest);
    const options = {
        hostname: JIRA_DNS,
        port: JIRA_PORT,
        path: '/rest/api/2/issue/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    const req = https.request(options, res => {
        let responseData = '';
        res.on('data', function (chunk) {responseData += chunk;});
        res.on('end', function () {
            return globalResponse.status(res.statusCode).send(responseData);
        });
    })

    req.on('error', error => {
        return globalResponse.status(500).send(error.message);
    })

    req.write(requestData)
    req.end()
}

function health(request, response) {
    response.status(200).send('{"status":"OK"}');
}

module.exports.health = (request, response) => health(request, response);
module.exports.gateway = gateway;
module.exports.authMiddleware = authMiddleware;
