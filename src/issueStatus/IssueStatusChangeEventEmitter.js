const { EventEmitter, errorMonitor } = require('events');
const StatusChangeListener = require('./StatusChangeListener')

class IssueStatusChangeEventEmitter extends EventEmitter {}

// TODO: proper instance export
const statusChangeListener = new StatusChangeListener();
const issueStatusChangeEventEmitter = new IssueStatusChangeEventEmitter();

issueStatusChangeEventEmitter.on(errorMonitor, (err) => {
    // TODO: use it or lose it
    console.error('errorMonitor');
    console.error(err);
});

issueStatusChangeEventEmitter.on('IssueUpdated', (requestPayload, callback) => {
    console.log('IssueUpdated event occurred!');
    statusChangeListener.react(requestPayload, callback);
});

module.exports.issueStatusChangeEventEmitter = issueStatusChangeEventEmitter;
