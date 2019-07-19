'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {Tagger, Tags, register, AwsApiConfig} from './base';

class DefaultTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'ResourceGroupsTaggingAPI',
            awsApiVersion  : '2017-01-26',
            rateLimit      : 100,
            rateIncrease   : 100
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        return new Promise((resolve, reject) => {
            reject('_serviceGetTags not implemented');
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
                    if (Object.keys(data['FailedResourcesMap']).length > 0) {
                        let errorMap = {
                            name: 'TagUpdateError',
                            code: 'FailedResourcesMap',
                            resource: this.config.resourceArn,
                            message: data['FailedResourcesMap'][this.config.resourceArn]['ErrorMessage'],
                            httpCode: data['FailedResourcesMap'][this.config.resourceArn]['StatusCode'],
                            errorCode: data['FailedResourcesMap'][this.config.resourceArn]['ErrorCode'],
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
                    if (Object.keys(data['FailedResourcesMap']).length > 0) {
                        reject( {
                            name: 'TagDeleteError',
                            code: 'FailedResourcesMap',
                            message: data['FailedResourcesMap']['ErrorMessage'],
                            httpCode: data['FailedResourcesMap']['StatusCode'],
                            errorCode: data['FailedResourcesMap']['ErrorCode'],
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
