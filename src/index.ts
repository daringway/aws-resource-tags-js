'use strict';

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import * as AWS from 'aws-sdk';
import 'source-map-support/register'
import { Tagger, getWorkerInstance } from './workers/base';
// NOTE workers/index.ts is dynamically generated at build time, look in taskfile.js for the magic
import './workers/';


// class TagWorkerNotFoundError extends Error {
//     constructor(workerName, arn) {
//         super('Tagger ' + workerName + ' not found for ' + arn);
//         this.name = 'TagWorkerNotFoundError';
//     }
// }

// class ResourceNotFoundError extends Error {
//     constructor(arn) {
//         super('Resource not found: ' + arn);
//         this.name = 'TagWorkerNotFoundError';
//     }
// }

function getRegion(region : string) : string {
    if (region) {
        return region;
    } else if (process.env.AWS_REGION) {
        return process.env.AWS_REGION;
    } else if (process.env.AWS_DEFAULT_REGION) {
        return process.env.AWS_DEFAULT_REGION
    }
    return null;
}

async function taggerCallback(callback, resourceData, region) {
    let tagger = getTaggerByArn(resourceData.ResourceARN, region);
    if ( tagger === null ) {
        return null;
    }

    tagger.setTagKeyValueArray(resourceData.Tags);
    try {
        await callback(tagger);
    } catch (err) {
        if ((typeof err.code === 'string') && err.code.endsWith('.NotFound')) {
            // Sometimes the resource will delete between listing and the callback, ignore these.
            return;
        } else {
            throw err;
        }
    }
}

// Uses the ResourceGroupsTaggingApi.getResources
// Optional
export async function forEachTagger(params : object, callback : Function, region? : string)  {
    let foundRegion = getRegion(region);

    if (foundRegion === null) {
        throw new Error('Must pass in region or set AWS_REGION environment variable');
    }

    let rgTagApi = new AWS['ResourceGroupsTaggingAPI']({apiVersion: '2017-01-26', region:foundRegion});

    params['ResourcesPerPage'] = 100;
    let data = await rgTagApi.getResources(params).promise();

    // Want to do this in sequence otherwise AWS API get unhappy
    for (let i = 0; i < data['ResourceTagMappingList'].length; i++) {
        let x = data['ResourceTagMappingList'][i];
        await taggerCallback(callback, x, foundRegion);
    }
    // let results = data['ResourceTagMappingList'].map(x => taggerCallback(callback, x, foundRegion));
    // await Promise.all(results);

    if (data['PaginationToken']) {
        params['PaginationToken'] = data['PaginationToken'];
        await forEachTagger(params, callback);
    }

}

export function getTaggerByArn(resourceArn : string, resourceRegion? : string): Tagger | null{
    let service = resourceArn.split(':')[2];
    let region = resourceArn.split(':')[3];
    let accountId = resourceArn.split(':')[4];
    let resourceType = null;
    let resourceId = null;

    if (! region) {
        region = getRegion(resourceRegion);
    }

    let parts = resourceArn.split(':');
    if (parts.length === 7) {
        resourceType = resourceArn.split(':')[5];
        resourceId = resourceArn.split(':')[6];
    } else {
        let resourceParts = parts[5].split('/');
        if (resourceParts.length == 1) {
            resourceType = service;
            resourceId = resourceParts[0];
        } else {
            resourceType = resourceParts[0];
            resourceId   = resourceParts.slice(1).join('/');
        }
    }

    return getWorkerInstance(resourceArn, service, region, accountId, resourceType, resourceId);
}

// export function getTaggerByCloudwatchEvent(event) : Tagger {
//     let account   = event.account;
//     let region    = event.region;
//     let source    = event.detail.eventSource;
//     let eventName = event.detail.eventName;
//     let ownerArn  = event.detail.userIdentity.arn;
// }
