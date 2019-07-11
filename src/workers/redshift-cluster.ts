'use strict';

import {Tagger, Tags, register, AwsApiConfig} from './base';

class RedshiftTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'Redshift',
            awsApiVersion  : '2012-12-01'
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ResourceName: this.config.resourceArn
        };
        let data = await this.getAwsFunction().describeTags(params).promise();
        let tags = {};
        data['TaggedResources'].forEach( (iData) => {
            let tag = iData['Tag'];
            tags[tag['Key']] = tag['Value'];
        });
        return(tags);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceName: this.config.resourceArn,
            Tags: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().createTags(params).promise();
    }

    protected async _serviceDeleteTags(tagKeys : string[]) {
        let params = {
            ResourceName: this.config.resourceArn,
            TagKeys: tagKeys
        };
        return this.getAwsFunction().deleteTags(params).promise();
    }
}

register(RedshiftTagger, 'redshift', 'cluster');
