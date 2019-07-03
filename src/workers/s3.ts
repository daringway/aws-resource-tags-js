'use strict';

import { Tagger, register  }  from "./base";

class S3Tagger extends Tagger {

    protected _getAwsLibraryName() : string { return  'S3'; };
    protected _getAwsApiVersion () : string { return  '2006-03-01'; };

    protected async getResourceRegion() : Promise<string> {
        var params = {
            Bucket: this.config.resourceId
        };
        let data = await this.getAwsFunction(true).getBucketLocation(params).promise();
        return data['LocationConstraint'];
    }

    protected async _serviceGetTags() : Promise<object> {
        let params = {
            Bucket: this.config.resourceId
        };
        return this.getAwsFunction().getBucketTagging(params).promise()
            .then((data) => {
                return this._akvToMap(data['TagSet']);
            });
    };

    protected async _updateAndDeleteTags(tagsToUpdate, keysToDelete) {
        if ((Object.keys(keysToDelete).length
            + Object.keys(tagsToUpdate).length) == 0) {
          return new Promise((resolve) => { resolve() });
        }

        let params = {
            Bucket: this.config.resourceId,
            Tagging: {
                TagSet: this._kvMapToArray(this.tags)
            }
        };
        return this.getAwsFunction().putBucketTagging(params).promise()
    }

    // Overriding updateAndDeleteTags so these are not used by base class, need handle abstract
    protected async _serviceDeleteTags(tagsToDeleteList) {
    }

    protected async _serviceUpdateTags(tagMapUpdates) {
    }
}

register(S3Tagger, 's3');



