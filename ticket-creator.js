const DEFAULT_PROJECT_ID = process.env.DEFAULT_PROJECT_ID ?? 10545;
const PROJECT_SHERPA_ID = 10522;

const INVOICING_PAYMENT_AND_TAXATION = 49;
const WORKFLOW_AND_PROCESSES = 52;
const EXTERNAL_TOOLS = 54;

const https = require('https');
const express = require('express');

function getTargetProjectId(requestTypeId) {
    if (requestTypeId === INVOICING_PAYMENT_AND_TAXATION ||
        requestTypeId === WORKFLOW_AND_PROCESSES ||
        requestTypeId === EXTERNAL_TOOLS
    ) {
        return PROJECT_SHERPA_ID;
    }

    return DEFAULT_PROJECT_ID;
}

function createTicket(globalRequest, globalResponse) {
    // parse info about created ticket
    let eventType = globalRequest.body.webhookEvent
    let ticket = globalRequest.body.issue;
    let summary = ticket.fields.summary;
    let description = ticket.fields.description;
    let requestTypeId = ticket.fields.customfield_10617.requestType.id;
    let requestTypeName = ticket.fields.customfield_10617.requestType.name;

    console.debug('eventType: ' + eventType);
    console.debug('id: ' + ticket.id);
    console.debug('key: ' + ticket.key);
    console.debug('issue type: ' + ticket.fields.issuetype.name);
    console.debug('issue status: ' + ticket.fields.status.name);
    console.debug('project: ' + ticket.fields.project.name);
    console.debug('summary: ' + summary);
    console.debug('description: ' + description);
    console.debug('requestTypeId: ' + requestTypeId);
    console.debug('requestTypeName: ' + requestTypeName);

    // prepare request
    let ticketRequest = {
        fields: {
            project:
                {
                    id: DEFAULT_PROJECT_ID
                },
            summary: summary,
            description: description,
            issuetype: {
                id: ISSUE_TYPE_ID
            },
            labels: ["jira-echo"]
        },
        update: {
            issuelinks: [
                {
                    add: {
                        type: {
                            name: "Relates",
                            inward: "is caused by",
                            outward: "causes"
                        },
                        inwardIssue: {
                            key: ticket.key
                        }
                    }
                }
            ],
        }
    };

    const authorizationHeader = prepareAuthorizationHeader();
    const requestData = JSON.stringify(ticketRequest);
    const options = {
        hostname: JIRA_DNS,
        port: JIRA_PORT,
        path: '/rest/api/2/issue/',
        method: 'POST',
        headers: {
            'Authorization': authorizationHeader,
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
            console.debug('createTicket attempt complete');
            console.debug('responseCode: ' + res.statusCode);
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

module.exports.createTicket = (request, response) => createTicket(request, response);
