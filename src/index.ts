/* eslint-disable prefer-destructuring */

/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import * as AWS from 'aws-sdk';
import 'source-map-support/register';
import { getWorkerInstance, Tagger } from './workers/base';
// NOTE workers/index.ts is dynamically generated at build time, look in taskfile.js for the magic
import './workers';

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

function getRegion(region: string): string {
  if (region) {
    return region;
  }
  if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  }
  if (process.env.AWS_DEFAULT_REGION) {
    return process.env.AWS_DEFAULT_REGION;
  }
  return null;
}


export function getTaggerByArn(resourceArn: string, resourceRegion?: string): Tagger | null {
  const service : string = resourceArn.split(':')[2];
  let region : string = resourceArn.split(':')[3];
  const accountId :string = resourceArn.split(':')[4];
  let resourceType : string;
  let resourceId : string;

  if (!region) {
    region = getRegion(resourceRegion);
  }
  const parts = resourceArn.split(':');
  if (parts.length === 7) {
    resourceType = parts[5];
    resourceId = parts[6];
  } else if (parts.length === 8) {
    resourceType = parts[5];
    resourceId = parts[7].split('/')[1];
  } else {
    const resourceParts = parts[5].split('/');
    if (resourceParts.length === 1) {
      resourceType = service;
      resourceId = resourceParts[0];
    } else {
      resourceType = resourceParts[0];
      resourceId = resourceParts.slice(1).join('/');
    }
  }

  return getWorkerInstance(resourceArn, service, region, accountId, resourceType, resourceId);
}

async function taggerCallback(callback, resourceData, region) {
  const tagger = getTaggerByArn(resourceData.ResourceARN, region);
  if (tagger === null) {
    return;
  }

  tagger.setTagKeyValueArray(resourceData.Tags);
  try {
    await callback(tagger);
  } catch (err) {
    if ((typeof err.code === 'string') && err.code.endsWith('.NotFound')) {
      // Sometimes the resource will delete between listing and the callback, ignore these.

    } else {
      throw err;
    }
  }
}

// Uses the ResourceGroupsTaggingApi.getResources
// Optional
export async function forEachTagger(
  rgtParams: AWS.ResourceGroupsTaggingAPI.GetResourcesInput,
  callback: Function, region?: string,
) {
  const foundRegion = getRegion(region);
  if (foundRegion === null) {
    throw new Error('Must pass in region or set AWS_REGION environment variable');
  }

  const rgTagApi = new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: foundRegion });

  const params = rgtParams;
  params.ResourcesPerPage = 100;
  const data = await rgTagApi.getResources(params).promise();

  // Want to do this in sequence otherwise AWS API get unhappy
  for (let i = 0; i < data.ResourceTagMappingList.length; i += 1) {
    const x = data.ResourceTagMappingList[i];
    await taggerCallback(callback, x, foundRegion);
  }

  if (data.PaginationToken) {
    params.PaginationToken = data.PaginationToken;
    await forEachTagger(params, callback);
  }
}

// export function getTaggerByCloudwatchEvent(event) : Tagger {
//     let account   = event.account;
//     let region    = event.region;
//     let source    = event.detail.eventSource;
//     let eventName = event.detail.eventName;
//     let ownerArn  = event.detail.userIdentity.arn;
// }
