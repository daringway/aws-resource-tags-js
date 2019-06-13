
const AWS = require('aws-sdk');

var resourceTagFactory = require('.');

let testArns = [
    'arn:aws:lambda:us-east-1:717475838310:function:cloudfront-edge-index',
    'arn:aws:ec2:us-east-1:717475838310:instance/i-034e6e41f6cfc1e73',
    'arn:aws:ec2:us-east-1:717475838310:subnet/subnet-0df91151',
    'arn:aws:cloudfront::717475838310:distribution/EIN0PLW2VI08W'
];

let tag_value = "walter";

// let tagger = resourceTagFactory.getTaggerByArn(testArns[0]);
// // console.log("xx", tagger.getTags());
// tagger.getTags().then(function(tags) {
//     console.log(tags);
// });
// console.log('tagger', tagger);
//
testArns.forEach(function(arn) {
    let tagger = resourceTagFactory.getTaggerByArn(arn);
    tagger.getTags().then(function(result) {
        console.log(result);
        if (!( 'tagger' in result) || (result['tagger'] != tag_value)) {
            console.log('adding tagger information');
            tagger.updateTags({tagger: tag_value});
        }
        tagger.deleteTags(['tagger']);
    })
});

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