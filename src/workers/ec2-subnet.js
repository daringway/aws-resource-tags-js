'use strict';

const Ec2Worker = require('./ec2-instance');

module.exports = class Worker extends Ec2Worker {

    serviceGetTags() {
        var params = {
            Filters: [
                {
                    Name: "subnet-id",
                    Values: [
                        this.resourceId
                    ]
                }
            ]
        };
        return this.awsFunction.describeSubnets(params).promise()
            .then((data) => {
                return this.akvToMap(data['Subnets'][0]['Tags']);
            });
    };

    // Inherite from Ec2-instance
    // serviceUpdateTags(tags) {

}


