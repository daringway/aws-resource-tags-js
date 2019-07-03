'use strict';

import { Tagger, register }  from "./base";

class RDSTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'RDS'; };
    protected _getAwsApiVersion () : string { return '2014-10-31'; };

    protected _serviceGetTags() {
        let params = {
            ResourceName: this.config.resourceArn
        };
        return this.getAwsFunction().listTagsForResource(params).promise()
            .then((data) => {
                return this._akvToMap(data['TagList']);
            });
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            ResourceName: this.config.resourceArn,
            Tags: this._kvMapToArray(tags)
        };

        return this.getAwsFunction().addTagsToResource(params).promise();
    };

    protected _serviceDeleteTags(tagKeys) {
        let params = {
            ResourceName: this.config.resourceArn,
            TagKeys: tagKeys
        };

        return this.getAwsFunction().removeTagsFromResource(params).promise();
    }
}

register(RDSTagger, 'rds', 'cluster');