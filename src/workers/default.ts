'use strict';

import { Tagger, register }  from "./base";
let throttleRG = require('promise-ratelimit')(250);

class DefaultTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'ResourceGroupsTaggingAPI'; };
    protected _getAwsApiVersion()  : string { return '2017-01-26'; };

    _serviceGetTags() {
        return new Promise((resolve, reject) => {
            reject('_serviceGetTags not implemented');
        });
    };

    _serviceUpdateTags(tagMapUpdates) {
        return new Promise( (resolve, reject) => {
            let params = {
                ResourceARNList: [
                    this.config.resourceArn
                ],
                Tags: tagMapUpdates
            };
            throttleRG().then( () => {
                this.getAwsFunction().tagResources(params).promise()
                    .then((data) => {
                        if (Object.keys(data['FailedResourcesMap']).length > 0) {
                            let errorMap = {
                                name: "TagUpdateError",
                                code: 'FailedResourcesMap',
                                resource: this.config.resourceArn,
                                message: data['FailedResourcesMap'][this.config.resourceArn]['ErrorMessage'],
                                httpCode: data['FailedResourcesMap'][this.config.resourceArn]['StatusCode'],
                                errorCode: data['FailedResourcesMap'][this.config.resourceArn]['ErrorCode'],
                                retryDelay: 10,
                            }
                            reject(errorMap);
                        } else {
                            resolve();
                        }
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        });
    };

    _serviceDeleteTags(tagsToDeleteList) {
        return new Promise( (resolve, reject) => {
            let params = {
                ResourceARNList: [
                    this.config.resourceArn
                ],
                TagKeys: tagsToDeleteList
            };
            throttleRG().then( () => {
                this.getAwsFunction().untagResources(params).promise()
                    .then( (data) => {
                        if (Object.keys(data['FailedResourcesMap']).length > 0) {
                            reject( {
                                name: "TagDeleteError",
                                code: 'FailedResourcesMap',
                                message: data['FailedResourcesMap']['ErrorMessage'],
                                httpCode: data['FailedResourcesMap']['StatusCode'],
                                errorCode: data['FailedResourcesMap']['ErrorCode'],
                                retryDelay: 10,
                            });
                        } else {
                            resolve();
                        }
                    })
                    .catch( (err) => {
                        reject(err);
                    });
            })
        });
    };

}

register(DefaultTagger, undefined);
