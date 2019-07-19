'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import {Tagger, Tags, register, AwsApiConfig} from './base';
import Ec2InstanceTagger from './ec2-instance';

class Ec2SubnetTagger extends Ec2InstanceTagger {

    protected  async _serviceGetTags() : Promise<Tags> {
        let params = {
            Filters: [
                {
                    Name: 'subnet-id',
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        let data = await this.getAwsFunction().describeSubnets(params).promise();
        return Tagger._akvToMap(data['Subnets'][0]['Tags']);
    };

    protected async _isTaggableState(): Promise<boolean> {
        return true;
    }
}

register(Ec2SubnetTagger, 'ec2', 'subnet');


