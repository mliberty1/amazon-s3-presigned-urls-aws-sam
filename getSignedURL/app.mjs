/*
  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Import only the required packages from AWS SDK v3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client with the region
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const TOKEN = "3e7cab40f25591dc4a9e58607e5cd8e73d665fd400aebbb189984926eae0e3a5";

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;

// Main Lambda entry point
export async function handler(event, context) {
  const d = new Date();
  const key_prefix = 
    d.getUTCFullYear().toString() + 
    (d.getUTCMonth() + 1).toString().padStart(2, '0') + 
    d.getUTCDate().toString().padStart(2, '0') + '_' +
    d.getUTCHours().toString().padStart(2, '0') +
    d.getUTCMinutes().toString().padStart(2, '0') +
    d.getUTCSeconds().toString().padStart(2, '0');
  const key_randomID = parseInt(Math.random() * 10000000);
  const Key = `${key_prefix}_${key_randomID}.zip`;

  if (!event.queryStringParameters || (event.queryStringParameters.token != TOKEN)) {
    let response = {
        statusCode: 400,
        body: JSON.stringify({ error: 'invalid request' }),
        headers: {
          'Content-Type': 'application/json',
        }
    };
    return response;
  }

  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    ContentType: 'application/octet-stream',
  };

  console.log('Params: ', s3Params);
  const command = new PutObjectCommand(s3Params);
  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRATION_SECONDS });

  return JSON.stringify({
    uploadURL: uploadURL,
    Key
  });
};
