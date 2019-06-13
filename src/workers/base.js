'use strict';

const AWS = require('aws-sdk');

module.exports = class ResourceDefaultTagWorker {
    constructor(resourceArn, service, region, accountId, resourceType, resourceId, library, apiVersion) {
        this.arn = resourceArn;
        this.service = service;
        this.region = region;
        this.accountId = accountId;
        this.resourceType = resourceType;
        this.resourceId = resourceId;

        this.cached_tags = null;

        this.awsFunction = new AWS[library]({apiVersion: apiVersion, region: this.region});
    };

    getTags() {
        return new Promise((resolve) => {
            if (this.cached_tags !== null) {
                resolve(this.cached_tags);
            }
            this.serviceGetTags().then((data) => {
               this.cached_tags = data;
               resolve(this.cached_tags);
            });
        })
    };

    updateTags(tagMap) {
        this.cached_tags = null;
        return this.serviceUpdateTags(tagMap);
    };

    deleteTags(tagList) {
        this.cached_tags = null;
        return this.serviceDeleteTags(tagList);
    }

    akvToMap(arrayOfKeyValues) {
        let newdata = {};
        arrayOfKeyValues.forEach(function(element){
            newdata[element['Key']] = element['Value'];
        });
        return newdata;
    };

    kvMapToArray(tagMap) {
        let newarray = [];
        for ( let key in tagMap ) {
            newarray.push({'Key': key, 'Value': tagMap[key]});
        }
        return newarray;
    }

    keyListToListMap(tags) {
        let newlist = []
        tags.forEach(function(key){
            newlist.push({'Key': key})
        });
        return newlist;
    }

    serviceGetTags() {
        return new Promise( (resolve, reject) => {
            reject('not implemented');
        });
    };

    serviceUpdateTags(tagMap) {
        return new Promise(function (resolve, reject) {
            reject('not implemented');
        });
    };

    serviceDeleteTags(tagList) {
        return new Promise(function (resolve, reject) {
            reject('not implemented');
        });
    };
}

