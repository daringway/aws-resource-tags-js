'use strict';

import {register} from "./base";
import Ec2InstanceTagger  from "./ec2-instance";

class Ec2VolumeTagger extends Ec2InstanceTagger {

    protected _serviceGetTags() {
        var params = {
            Filters: [
                {
                    Name: "ec2-volume",
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        return this.getAwsFunction().describeVolumes(params).promise()
            .then((data) => {
                return this._akvToMap(data['Volumes'][0]['Tags']);
            });
    };

};
register(Ec2VolumeTagger, 'ec2', 'volume');

