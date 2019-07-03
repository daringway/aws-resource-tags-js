'use strict';

import { Tagger, register }  from "./base";

class LambdaTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'Lambda'; };
    protected _getAwsApiVersion () : string { return '2015-03-31'; };

    protected _serviceGetTags() {
        let params = {
            Resource: this.config.resourceArn
        };

        return this.getAwsFunction().listTags(params).promise()
            .then(function (data) {
                return data['Tags'];
            });
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            Tags: tags
        };

        return this.getAwsFunction().tagResource(params).promise();
    };

    protected _serviceDeleteTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            TagKeys: tags
        };

        return this.getAwsFunction().untagResource(params).promise();
    }
};

register(LambdaTagger, 'lambda', 'function');