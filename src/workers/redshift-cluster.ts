'use strict';

import { Tagger, register }  from "./base";

class RedshiftTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'Redshift'; };
    protected _getAwsApiVersion () : string { return '2012-12-01'; };

    protected _serviceGetTags() {
        let params = {
            ResourceName: this.config.resourceArn
        };
        return new Promise( (resolve, reject) => {
            this.getAwsFunction().describeTags(params).promise()
            .then((data) => {

                let tags = {};
                data['TaggedResources'].forEach( (iData) => {
                    let tag = iData['Tag']
                    tags[tag['Key']] = tag['Value'];
                });
                resolve(tags);
            }).catch( (e) => {
                reject(e);
            });
        })
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            ResourceName: this.config.resourceArn,
            Tags: this._kvMapToArray(tags)
        };
        return this.getAwsFunction().createTags(params).promise();
    }

    protected _serviceDeleteTags(tagKeys) {
        let params = {
            ResourceName: this.config.resourceArn,
            TagKeys: tagKeys
        };
        return this.getAwsFunction().deleteTags(params).promise();
    }
}

register(RedshiftTagger, 'redshift', 'cluster');
