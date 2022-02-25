class StatusToInProgressEvent {
    constructor(sourceTicket) {
        this.sourceTicket = sourceTicket;
    }

    get targetTickets() {
        return this.sourceTicket.fields.issuelinks;
    }
}
