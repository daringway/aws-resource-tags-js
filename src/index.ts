'use strict';

// require('source-map-support').install();
import 'source-map-support/register'

import { Tagger, getWorkerInstance } from "./workers/base";

// NOTE factory is dynamically generated at build time, look in taskfile.js
import "./factory";
const AWS = require('aws-sdk');

const rgTagApi = new AWS['ResourceGroupsTaggingAPI']({apiVersion: '2017-01-26', region: 'us-east-1'});

let workers = {};

class TagWorkerNotFoundError extends Error {
    constructor(workerName, arn) {
        super('Tagger ' + workerName + ' not found for ' + arn);
        this.name = 'TagWorkerNotFoundError';
    }
}

class ResourceNotFoundError extends Error {
    constructor(arn) {
        super('Resource not found: ' + arn);
        this.name = 'TagWorkerNotFoundError';
    }
}

// export function getWorkerInstance(workerName : string,
//                            resourceArn : string,
//                            service : string,
//                            region : string,
//                            accountId : string,
//                            resourceType : string,
//                            resourceId : string ) : DefaultTagger {
//     let path = './workers/' + workerName;
//     if ( ! fs.existsSync(path)) {
//         path = './workers/base';
//     }
//     console.log("taggerx", path);
//     import ( path ).then((Tagger) => {
//         console.log("typeof", typeof Tagger, Tagger);
//         return new Tagger(resourceArn, service, region, accountId, resourceType, resourceId);
//     });
//     // let Tagger = await import(path);
//     // return new Tagger(resourceArn, service, region, accountId, resourceType, resourceId);
//     // });
// }

export function taggerCallback(callback, resourceData) {
    let tagger = getTaggerByArn(resourceData.ResourceARN);
    // if ( tagger.service !== 'cloudformation') {}
    // @ts-ignore
    if ( ["cloudformation", 'events'].includes(tagger.service) ) {
        // Services doesn't support tagging
        // @ts-ignore
        return tagger.service;
    } else {
        tagger.setTagKeyValueArray(resourceData.Tags);
        return callback(tagger);
    }
}

// Uses the ResourceGroupsTaggingApi.getResources
export async function forEachTagger(params, callback)  {
    params['ResourcesPerPage'] = 50;
    return new Promise( (resolve, reject) => {
        rgTagApi.getResources(params).promise()
            .then((data) => {
                let results = data['ResourceTagMappingList'].map(x => taggerCallback(callback, x));
                Promise.all(results)
                    .then(() => {
                        if (data['PaginationToken']) {
                            params['PaginationToken'] = data['PaginationToken'];
                            resolve(forEachTagger(params, callback));
                        } else {
                            resolve();
                        }
                    }).catch(err => reject(err));
            });
    });
}

let x={
    "version": "0",
    "id": "cb7bbdd3-8921-8e67-a9d6-4562e6be8e9d",
    "detail-type": "AWS API Call via CloudTrail",
    "source": "aws.ec2",
    "account": "717475838310",
    "time": "2019-06-26T02:51:10Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "eventVersion": "1.05",
        "userIdentity": {
            "type": "IAMUser",
            "principalId": "AIDAJNAG4JWHXJIABRLZQ",
            "arn": "arn:aws:iam::717475838310:user/wderezin",
            "accountId": "717475838310",
            "accessKeyId": "AKIAIJVUEL76UECGHEFQ",
            "userName": "wderezin"
        },
        "eventTime": "2019-06-26T02:51:10Z",
        "eventSource": "ec2.amazonaws.com",
        "eventName": "RunInstances",
        "awsRegion": "us-east-1",
        "sourceIPAddress": "172.13.160.183",
        "userAgent": "aws-sdk-go/1.20.4 (go1.12.5; darwin; amd64) APN/1.0 HashiCorp/1.0 Terraform/0.12.2",
        "requestParameters": {
            "instancesSet": {
                "items": [
                    {
                        "imageId": "ami-00d4e9ff62bc40e03",
                        "minCount": 1,
                        "maxCount": 1
                    }
                ]
            },
            "instanceType": "t3.nano",
            "blockDeviceMapping": {},
            "monitoring": {
                "enabled": false
            },
            "disableApiTermination": false,
            "iamInstanceProfile": {},
            "ebsOptimized": false,
            "tagSpecificationSet": {
                "items": [
                    {
                        "resourceType": "instance",
                        "tags": [
                            {
                                "key": "Name",
                                "value": "TagComplianceTest1 Alpha1"
                            }
                        ]
                    }
                ]
            },
            "creditSpecification": {
                "cpuCredits": "unlimited"
            }
        },
        "responseElements": {
            "requestId": "f65b3e71-f860-4490-8489-e11d6ffcdf31",
            "reservationId": "r-04d2ca9c3d1976508",
            "ownerId": "717475838310",
            "groupSet": {},
            "instancesSet": {
                "items": [
                    {
                        "instanceId": "i-04203d8a8f33633ee",
                        "imageId": "ami-00d4e9ff62bc40e03",
                        "instanceState": {
                            "code": 0,
                            "name": "pending"
                        },
                        "privateDnsName": "ip-172-31-30-242.ec2.internal",
                        "amiLaunchIndex": 0,
                        "productCodes": {},
                        "instanceType": "t3.nano",
                        "launchTime": 1561517470000,
                        "placement": {
                            "availabilityZone": "us-east-1c",
                            "tenancy": "default"
                        },
                        "monitoring": {
                            "state": "disabled"
                        },
                        "subnetId": "subnet-2af7b471",
                        "vpcId": "vpc-be4bd2d8",
                        "privateIpAddress": "172.31.30.242",
                        "stateReason": {
                            "code": "pending",
                            "message": "pending"
                        },
                        "architecture": "x86_64",
                        "rootDeviceType": "ebs",
                        "rootDeviceName": "/dev/sda1",
                        "blockDeviceMapping": {},
                        "virtualizationType": "hvm",
                        "hypervisor": "xen",
                        "tagSet": {
                            "items": [
                                {
                                    "key": "Name",
                                    "value": "TagComplianceTest1 Alpha1"
                                }
                            ]
                        },
                        "groupSet": {
                            "items": [
                                {
                                    "groupId": "sg-19620665",
                                    "groupName": "default"
                                }
                            ]
                        },
                        "sourceDestCheck": true,
                        "networkInterfaceSet": {
                            "items": [
                                {
                                    "networkInterfaceId": "eni-0e16ffc7c216502c7",
                                    "subnetId": "subnet-2af7b471",
                                    "vpcId": "vpc-be4bd2d8",
                                    "ownerId": "717475838310",
                                    "status": "in-use",
                                    "macAddress": "0e:bf:bc:a8:c1:b6",
                                    "privateIpAddress": "172.31.30.242",
                                    "privateDnsName": "ip-172-31-30-242.ec2.internal",
                                    "sourceDestCheck": true,
                                    "interfaceType": "interface",
                                    "groupSet": {
                                        "items": [
                                            {
                                                "groupId": "sg-19620665",
                                                "groupName": "default"
                                            }
                                        ]
                                    },
                                    "attachment": {
                                        "attachmentId": "eni-attach-097a8290d5f95c0da",
                                        "deviceIndex": 0,
                                        "status": "attaching",
                                        "attachTime": 1561517470000,
                                        "deleteOnTermination": true
                                    },
                                    "privateIpAddressesSet": {
                                        "item": [
                                            {
                                                "privateIpAddress": "172.31.30.242",
                                                "privateDnsName": "ip-172-31-30-242.ec2.internal",
                                                "primary": true
                                            }
                                        ]
                                    },
                                    "ipv6AddressesSet": {},
                                    "tagSet": {}
                                }
                            ]
                        },
                        "ebsOptimized": false,
                        "cpuOptions": {
                            "coreCount": 1,
                            "threadsPerCore": 2
                        },
                        "capacityReservationSpecification": {
                            "capacityReservationPreference": "open"
                        }
                    }
                ]
            }
        },
        "requestID": "f65b3e71-f860-4490-8489-e11d6ffcdf31",
        "eventID": "c13adb46-cc03-460e-b5b9-30e2ccfcf420",
        "eventType": "AwsApiCall"
    }
};

// export function getTaggerByCloudwatchEvent(event) : Tagger {
//     let account   = event.account;
//     let region    = event.region;
//     let source    = event.detail.eventSource;
//     let eventName = event.detail.eventName;
//     let ownerArn  = event.detail.userIdentity.arn;
// }

export function getTaggerByArn(resourceArn): Tagger {
    let service = resourceArn.split(':')[2];
    let region = resourceArn.split(':')[3];
    let accountId = resourceArn.split(':')[4];
    let resourceType = null;
    let resourceId = null;

    if (['lambda', 'rds', 'redshift'].indexOf(service) >= 0) {
        resourceType = resourceArn.split(':')[5];
        resourceId = resourceArn.split(':')[6];
    } else if (['ec2', 'subnet', 'cloudfront', 'elasticloadbalancing', 'dynamodb', 'es'].indexOf(service) >= 0) {
        let resource = resourceArn.split(':')[5];
        resourceType = resource.split('/')[0];
        resourceId = resource.split('/')[1];
    } else if (['s3'].indexOf(service) >= 0) {
        resourceType = service;
        resourceId = resourceArn.split(':')[5];
    } else {
        resourceType = 'unknown';
        resourceId = 'unknown';
    }

    return getWorkerInstance(resourceArn, service, region, accountId, resourceType, resourceId);

}

// module.exports = {getTaggerByArn, forEachTagger, TagWorkerNotFoundError, ResourceNotFoundError, getWorkerInstance};

// module.exports = {getTaggerByArn, forEachTagger, TagWorkerNotFoundError, ResourceNotFoundError, getWorkerInstance};
