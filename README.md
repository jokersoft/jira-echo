# Jira Echo - a simple webhook listen & react

# Links
- [Jira RES API Webhooks](https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-webhooks/#api-group-webhooks)

## TODO
- use verbose statuses
- default additionalFields
- statusFrom "*" wildcard
- handle errors gracefully
  - https://www.fullstacktutorials.com/tutorials/nodejs/nodejs-expressjs-middleware.html ?
- use https://github.com/external-secrets/kubernetes-external-secrets for safe secret injection into helm
- check if there's any value in https://www.npmjs.com/package/jira.js
- create and use Bot identity
- tests
- PubSub for events (webhooks reliability)
- [evaluate proper logger](https://ibm-cloud-architecture.github.io/b2m-nodejs/logging/)
