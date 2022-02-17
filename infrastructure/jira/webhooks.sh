#!/usr/bin/env bash

BASIC_AUTH_HEADER=$1
BASIC_AUTH_HEADER_ENCODED=rawurldecode ${BASIC_AUTH_HEADER}

curl --location --request POST 'https://comtravo.atlassian.net/rest/webhooks/1.0/webhook' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic ${BASIC_AUTH_HEADER}' \
--data-raw '{
    "name": "BS issue created",
    "url": "https://jira-echo.infra.comtravo.com/api/ticket-created?authorization=Basic%20${BASIC_AUTH_HEADER_ENCODED}",
    "events": [
        "jira:issue_created"
    ],
    "filters": {
        "issue-related-events-section": "Project = BS"
    },
    "excludeBody": false
}'

curl --location --request POST 'https://comtravo.atlassian.net/rest/webhooks/1.0/webhook' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic ${BASIC_AUTH_HEADER}' \
--data-raw '{
    "name": "BUGS issue updated",
    "url": "https://jira-echo.infra.comtravo.com/api/ticket-updated?authorization=Basic%20${BASIC_AUTH_HEADER_ENCODED}",
    "events": [
        "jira:issue_updated"
    ],
    "filters": {
        "issue-related-events-section": "Project = BUGS AND labels = \"jira-echo\""
    },
    "excludeBody": false
}'
