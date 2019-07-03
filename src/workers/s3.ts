'use strict';

import { Tagger, register  }  from "./base";

class S3Tagger extends Tagger {

    protected _getAwsLibraryName() : string { return  'S3'; };
    protected _getAwsApiVersion () : string { return  '2006-03-01'; };

    protected getResourceRegion() {
        let region = super.getResourceRegion();
        if ( ! region ) {

            var params = {
                Bucket: this.config.resourceId
            };
            this.getAwsFunction().getBucketLocation(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
                /*
                data = {
                 LocationConstraint: "us-west-2"
                }
                */
            });
        }
    }

    _serviceGetTags() {
        let params = {
            Bucket: this.config.resourceId
        };
        return this.getAwsFunction().getBucketTagging(params).promise()
            .then((data) => {
                return this._akvToMap(data['TagSet']);
            });
    };

    _updateAndDeleteTags(tagsToUpdate, keysToDelete) {
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
    protected _serviceDeleteTags(tagsToDeleteList) {
    }

    protected _serviceUpdateTags(tagMapUpdates) {
    }
}

register(S3Tagger, 's3');



