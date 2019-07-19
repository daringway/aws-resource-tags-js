'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {Tagger, Tags, register, AwsApiConfig} from './base';

class ElasticSearchTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'ES',
            awsApiVersion  : '2015-01-01'
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ARN: this.config.resourceArn
        };
        let data = await this.getAwsFunction().listTags(params).promise();
        return Tagger._akvToMap(data['TagList']);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ARN: this.config.resourceArn,
            TagList: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().addTags(params).promise();
    };

    protected async _serviceDeleteTags(tagKeys : string[]) {
        let params = {
            ARN: this.config.resourceArn,
            TagKeys: tagKeys
        };
        return this.getAwsFunction().removeTags(params).promise();
    }
}

register(ElasticSearchTagger, 'es', 'domain');