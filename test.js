
const AWS = require('aws-sdk');

require('source-map-support').install();

var resourceTagFactory = require('.');

let testArns = [
    'arn:aws:lambda:us-east-1:717475838310:function:cloudfront-edge-index',
    'arn:aws:ec2:us-east-1:717475838310:instance/i-034e6e41f6cfc1e73',
    'arn:aws:ec2:us-east-1:717475838310:subnet/subnet-0df91151',
    'arn:aws:ec2:us-east-1:717475838310:volume/vol-03ffa5c53c9b21562',
    'arn:aws:elasticloadbalancing:us-east-1:717475838310:loadbalancer/app/testtttt/6e236e62264c47b1',
    'arn:aws:dynamodb:us-east-1:717475838310:table/daring-site-redirect',

    'arn:aws:cloudfront::717475838310:distribution/EIN0PLW2VI08W',
    'arn:aws:s3:::daring-packages'
];

let tag_value = "big number " + Math.random();
let tagComplianceName = 'tag-compliance';
let searchParams = {
TagFilters: [
        {
            Key: tagComplianceName
        }
    ]
};
// ResourceTypeFilters: [
//     'ec2:instance'
// ]

searchParams = {};

// let every = 4;
// let count = every;
// resourceTagFactory.forEachTagger(searchParams, (tagger) => {
//     // console.log(tagger);
//     // console.log(tagger.tags['application'], tagger.tags[tagComplianceName], tagger.arn);
//     // if ( ! ('tagger' in tagger.tags) ) {
//     //     tagger.tags['tagger'] = tag_value;
//     // }
//     // tagger.tags[tagComplianceName] = 'unknown';
//     // tagger.tags['tag-compliance-state'] = 'pending';
//     // delete tagger.tags['tag-compliance'];
//     // delete tagger.tags['tag-compliance-state'];
//     // delete tagger.tags['tag-compliance-message'];
//
//     let value = Math.floor(Math.random() * 10 / 5)
//     if (count == 0) {
//         count = every;
//         tagger.tags['application'] = tag_value;
//         console.log('updating application', tagger.config.resourceArn);
//     } else if (count == 1) {
//         tagger.tags['tag-compliance'] = 'unknown';
//         console.log('rechecking unknown', tagger.config.resourceArn);
//     } else if (count == value) {
//         tagger.tags['application'] = tag_value;
//         console.log('updating application', tagger.config.resourceArn);
//     } else if (count == value) {
//         delete tagger.tags['application'];
//         console.log('deleting application', tagger.config.resourceArn);
//
//     }
//     count--;
//
//     return tagger.save();
// }).catch( err => {
//     console.log(err.stack);
// }).then( () => {
//     console.log("made it");
// })

testArns.forEach(async function(arn) {
    let tagger = resourceTagFactory.getTaggerByArn(arn);
    try {
        let v = await tagger.isTaggableState();
        console.log(v ? 'taggable' : 'not taggable',
            tagger.config.service,
            tagger.config.resourceType,
            tagger.config.resourceId);
    } catch (err) {
        console.log("ERROR", err);
    }
});

// testArns.forEach(function(arn) {
//     let tagger = resourceTagFactory.getTaggerByArn(arn);
//     // console.log('getting tags   ', arn);
//     tagger.load().then(function (tags) {
//         // console.log(arn, tags['owner']);
//         // console.log(tags);
//         console.log(tags['tagger'], arn)
//         tags['tagger'] = tag_value;
//         // delete tags['tagger'];
//     }).catch((e) => {
//         if (e.code == 'ResourceNotFoundFault') {
//             console.log("Skipping, resource not found ", arn);
//         } else {
//             console.log("**** uncaught ", e.code, e.message)
//         }
//     }).finally(() => {
//         // console.log("FINAL:", tagger.tags);
//         tagger.save();
//     });
// });

// const configservice = new AWS.ConfigService({region: 'us-east-1'});
// while (true) {
//     var params = {
//         resourceId: 'test-compliance', /* required */
//         resourceType: 'AWS::Lambda::Function',
//         chronologicalOrder: 'Forward',
//     };
//     configservice.getResourceConfigHistory(params, function (err, data) {
//         if (err) console.log(err, err.stack); // an error occurred
//         else console.log(data);           // successful response
//     });
// };

// const cloudtrail = new AWS.CloudTrail({region: 'us-east-1'});
// testArns.forEach(function(arn) {
//     let params = {
//         // EndTime: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//         LookupAttributes: [
//             {
//                 AttributeKey: 'ResourceName',
//                 AttributeValue: arn,
//                 // AttributeValue: 'test-compliance' /* required */
//             },
//         ],
//         // MaxResults: 1,
//         // NextToken: 'STRING_VALUE',
//         // StartTime: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789
//     };
//     cloudtrail.lookupEvents(params, function (err, data) {
//         if (err) console.log(err, err.stack); // an error occurred
//         else {
//             data['Events'].forEach(function (event) {
//                 console.log('x', JSON.parse(event['CloudTrailEvent'])['userIdentity']['arn']);
//             })
//         }           // successful response
//     });
// });

// var rgta = new AWS.ResourceGroupsTaggingAPI({region: 'us-east-1'});
//
// let params = {
//     ResourceTypeFilters: [
//         'ec2:instance/i-034e6e41f6cfc1e73'
//         // 'arn:aws:ec2:us-east-1:717475838310:instance/i-034e6e41f6cfc1e73'
//     ]
//
// };
//
// rgta.getResources(params).promise()
// .then( (data) => {
//     data['ResourceTagMappingList'].forEach( (x) => {
//         console.log(x.ResourceARN );
//     })
// })