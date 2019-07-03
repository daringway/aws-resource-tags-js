"use string";

module.exports = class DefaultArn {
    protected account: bigint;
    protected region: string;
    protected eventSource: string;
    protected eventName: string;
    protected ownerArn: string;

    constructor(event) {
        this.account     = event.account;
        this.region      = event.region;
        this.eventSource = event.detail.eventSource;
        this.eventName   = event.detail.eventName;
        this.ownerArn    = event.detail.userIdentity.arn;
    };
}