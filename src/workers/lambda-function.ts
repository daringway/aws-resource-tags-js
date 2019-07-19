'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {Tagger, Tags, register, AwsApiConfig} from './base';

class LambdaTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'Lambda',
            awsApiVersion  : '2015-03-31'
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Resource: this.config.resourceArn
        };

        let data = await this.getAwsFunction().listTags(params).promise();
        return data['Tags'];
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            Resource: this.config.resourceArn,
            Tags: tags
        };

        return this.getAwsFunction().tagResource(params).promise();
    };

    protected async _serviceDeleteTags(tags : string[]) {
        let params = {
            Resource: this.config.resourceArn,
            TagKeys: tags
        };

        return this.getAwsFunction().untagResource(params).promise();
    }
}

register(LambdaTagger, 'lambda', 'function');