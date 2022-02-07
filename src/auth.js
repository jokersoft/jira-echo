const DEFAULT_JIRA_PORT = 443;
const DEFAULT_JIRA_DNS = 'jira-echo.requestcatcher.com';

const JIRA_DNS = process.env.JIRA_DNS ?? DEFAULT_JIRA_DNS;
const JIRA_PORT = process.env.JIRA_PORT ?? DEFAULT_JIRA_PORT;

function getJiraDns() {
    return JIRA_DNS;
}

function getJiraPort() {
    return JIRA_PORT;
}

function prepareAuthorizationHeader() {
    return 'Basic ' + Buffer.from(process.env.JIRA_USER + ':' + process.env.JIRA_TOKEN).toString('base64');
}

module.exports.getJiraDns = getJiraDns();
module.exports.getJiraPort = getJiraPort();
module.exports.prepareAuthorizationHeader = (request, response) => prepareAuthorizationHeader(request, response);
