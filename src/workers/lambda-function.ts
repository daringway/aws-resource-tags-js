"use strict";

import { Tagger, register }  from "./base";

class LambdaTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "Lambda"; };
    protected _getAwsApiVersion () : string { return "2015-03-31"; };

    protected async _serviceGetTags() : Promise<object> {
        let params = {
            Resource: this.config.resourceArn
        };

        let data = await this.getAwsFunction().listTags(params).promise();
        return data["Tags"];
    };

    protected async _serviceUpdateTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            Tags: tags
        };

        return this.getAwsFunction().tagResource(params).promise();
    };

    protected async _serviceDeleteTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            TagKeys: tags
        };

        return this.getAwsFunction().untagResource(params).promise();
    }
}

register(LambdaTagger, "lambda", "function");