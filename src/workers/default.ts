"use strict";

import {Tagger, Tags, register, TaggerLimits} from "./base";

// Want this to be in a different set of limit
let defaultTypeLimits : TaggerLimits = {
    rateLimit   : 100
};


class DefaultTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "ResourceGroupsTaggingAPI"; };
    protected _getAwsApiVersion()  : string { return "2017-01-26"; };

    public getLimits(): TaggerLimits {
        return defaultTypeLimits;
    }

    protected async _serviceGetTags() : Promise<Tags> {
        return new Promise((resolve, reject) => {
            reject("_serviceGetTags not implemented");
        });
    };

    protected async _serviceUpdateTags(tagMapUpdates : Tags) {
        return new Promise( (resolve, reject) => {
            let params = {
                ResourceARNList: [
                    this.config.resourceArn
                ],
                Tags: tagMapUpdates
            };
            this.getAwsFunction().tagResources(params).promise()
                .then((data) => {
                    if (Object.keys(data["FailedResourcesMap"]).length > 0) {
                        let errorMap = {
                            name: "TagUpdateError",
                            code: "FailedResourcesMap",
                            resource: this.config.resourceArn,
                            message: data["FailedResourcesMap"][this.config.resourceArn]["ErrorMessage"],
                            httpCode: data["FailedResourcesMap"][this.config.resourceArn]["StatusCode"],
                            errorCode: data["FailedResourcesMap"][this.config.resourceArn]["ErrorCode"],
                            retryDelay: 100,
                            retryable: true
                        };
                        reject(errorMap);
                    } else {
                        resolve();
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    protected async _serviceDeleteTags(tagsToDeleteList : string[]) {
        return new Promise( (resolve, reject) => {
            let params = {
                ResourceARNList: [
                    this.config.resourceArn
                ],
                TagKeys: tagsToDeleteList
            };
            this.getAwsFunction().untagResources(params).promise()
                .then( (data) => {
                    if (Object.keys(data["FailedResourcesMap"]).length > 0) {
                        reject( {
                            name: "TagDeleteError",
                            code: "FailedResourcesMap",
                            message: data["FailedResourcesMap"]["ErrorMessage"],
                            httpCode: data["FailedResourcesMap"]["StatusCode"],
                            errorCode: data["FailedResourcesMap"]["ErrorCode"],
                            retryDelay: 100,
                            retryable: true
                        });
                    } else {
                        resolve();
                    }
                })
                .catch( (err) => {
                    reject(err);
                });
        });
    };
}

register(DefaultTagger, undefined);
