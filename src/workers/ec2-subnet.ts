'use strict';

import {register} from "./base";
import Ec2InstanceTagger from "./ec2-instance";

class Ec2SubnetTagger extends Ec2InstanceTagger {

    protected  async _serviceGetTags() : Promise<object> {
        var params = {
            Filters: [
                {
                    Name: "subnet-id",
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        return this.getAwsFunction().describeSubnets(params).promise()
            .then((data) => {
                return this._akvToMap(data['Subnets'][0]['Tags']);
            });
    };

};
register(Ec2SubnetTagger, 'ec2', 'subnet');


