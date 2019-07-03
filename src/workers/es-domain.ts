'use strict';

import { Tagger, register }  from "./base";


class ElasticSearchTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'ES'; };
    protected _getAwsApiVersion () : string { return '2015-01-01'; };

    protected _serviceGetTags() {
        let params = {
            ARN: this.config.resourceArn
        };
        return this.getAwsFunction().listTags(params).promise()
            .then((data) => {
                return this._akvToMap(data['TagList']);
            });
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            ARN: this.config.resourceArn,
            TagList: this._kvMapToArray(tags)
        };

        return this.getAwsFunction().addTags(params).promise();
    };

    protected _serviceDeleteTags(tagKeys) {
        let params = {
            ARN: this.config.resourceArn,
            TagKeys: tagKeys
        };

        return this.getAwsFunction().removeTags(params).promise();
    }
};

register(ElasticSearchTagger, 'es', 'domain');