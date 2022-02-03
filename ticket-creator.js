const PROJECT_ID_BUGS = 10545;
const PROJECT_ID_SHERPA = 10522;
const PROJECT_ID_DEFAULT = process.env.PROJECT_ID_DEFAULT ?? PROJECT_ID_BUGS;

const ISSUE_TYPE_ID_BUG = 10004;
const ISSUE_TYPE_ID_INCIDENT = 10121;

const REQUEST_TYPE_ID_GENERAL_BUG = 48;
const REQUEST_TYPE_ID_INVOICING_PAYMENT_AND_TAXATION = 49;
const REQUEST_TYPE_ID_CUSTOMER_BOOKING_EXPERIENCE = 50;
const REQUEST_TYPE_ID_FLIGHT_AND_TRAIN = 51;
const REQUEST_TYPE_ID_WORKFLOW_AND_PROCESSES = 52;
const REQUEST_TYPE_ID_COMPANY_ACCOUNT_AND_USER_MANAGEMENT = 53;
const REQUEST_TYPE_ID_EXTERNAL_TOOLS = 54;
const REQUEST_TYPE_ID_ACCOMMODATION = 55;
const REQUEST_TYPE_ID_RENTAL_CAR = 56;
const REQUEST_TYPE_ID_TRAVEL_MANAGEMENT = 57;
const REQUEST_TYPE_ID_CRITICAL_INCIDENT = 58;

const https = require('https');
const auth = require('./auth');

function getTargetIssueTypeId(requestTypeId) {
    if (requestTypeId === REQUEST_TYPE_ID_CRITICAL_INCIDENT) {
        return ISSUE_TYPE_ID_INCIDENT;
    }

    return ISSUE_TYPE_ID_BUG;
}

function getTargetProjectId(requestTypeId) {
    if (requestTypeId === REQUEST_TYPE_ID_GENERAL_BUG) {
        return PROJECT_ID_DEFAULT;
    }

    if (requestTypeId === REQUEST_TYPE_ID_INVOICING_PAYMENT_AND_TAXATION ||
        requestTypeId === REQUEST_TYPE_ID_WORKFLOW_AND_PROCESSES ||
        requestTypeId === REQUEST_TYPE_ID_EXTERNAL_TOOLS
    ) {
        return PROJECT_ID_SHERPA;
    }

    return PROJECT_ID_DEFAULT;
}

function createTicket(globalRequest, globalResponse) {
    // parse info about created ticket
    const eventType = globalRequest.body.webhookEvent
    const ticket = globalRequest.body.issue;
    const summary = ticket.fields.summary;
    const description = ticket.fields.description;
    const requestTypeId = ticket.fields.customfield_10617.requestType.id;
    const requestTypeName = ticket.fields.customfield_10617.requestType.name;

    // if custom field "Request Type" (`customfield_10617`) does not contain input - we cannot address it
    if (!requestTypeId) {
        console.error('RequestTypeId not set!');
        return globalResponse.status(500).send('RequestTypeId not set!');
    }

    const targetProjectId = getTargetProjectId(requestTypeId);
    const targetIssueTypeId = getTargetIssueTypeId(requestTypeId);

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
    console.debug('targetProjectId: ' + targetProjectId);

    // prepare request
    let ticketRequest = {
        fields: {
            project:
                {
                    id: targetProjectId
                },
            summary: summary,
            description: description,
            issuetype: {
                id: targetIssueTypeId
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

    const authorizationHeader = auth.prepareAuthorizationHeader();
    const requestData = JSON.stringify(ticketRequest);
    const options = {
        hostname: auth.getJiraDns,
        port: auth.getJiraPort,
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
