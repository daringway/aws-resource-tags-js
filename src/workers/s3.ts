'use strict';

import {Tagger, Tags, register, AwsApiConfig} from './base';

class S3Tagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'S3',
            awsApiVersion  : '2006-03-01'
        };
    };

    protected async getResourceRegion() : Promise<string> {
        let params = {
            Bucket: this.config.resourceId
        };
        let data = await this.getResourceAwsFunction().getBucketLocation(params).promise();
        return data['LocationConstraint'];
    }

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Bucket: this.config.resourceId
        };
        let data = await this.getAwsFunction().getBucketTagging(params).promise();
        return Tagger._akvToMap(data['TagSet']);

    };

    protected async _updateAndDeleteTags(tagsToUpdate : Tags, keysToDelete : string[]) {
        if ((Object.keys(keysToDelete).length
            + Object.keys(tagsToUpdate).length) == 0) {
          return;
        }

        let params = {
            Bucket: this.config.resourceId,
            Tagging: {
                TagSet: Tagger._kvMapToArray(this.tags)
            }
        };
        return this.getAwsFunction().putBucketTagging(params).promise();
    }

    // Overriding updateAndDeleteTags so these are not used by base class, need handle abstract
    protected async _serviceDeleteTags(tagsToDeleteList : string[]) {
    }

    protected async _serviceUpdateTags(tagMapUpdates : Tags) {
    }
}

register(S3Tagger, 's3');



