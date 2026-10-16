
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env manually since we are running in node
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('Testing S3 Connection...');
console.log('Endpoint:', process.env.VITE_S3_ENDPOINT);
console.log('Region:', process.env.VITE_S3_REGION);
console.log('Access Key:', process.env.VITE_S3_ACCESS_KEY_ID ? '***' + process.env.VITE_S3_ACCESS_KEY_ID.slice(-4) : 'MISSING');

const s3 = new S3Client({
    region: process.env.VITE_S3_REGION,
    endpoint: process.env.VITE_S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.VITE_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.VITE_S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
});

async function run() {
    try {
        console.log('Attempting to list buckets...');
        const data = await s3.send(new ListBucketsCommand({}));
        console.log('Success! Buckets found:');
        data.Buckets?.forEach(b => console.log(` - ${b.Name}`));
    } catch (err) {
        console.error('Connection Failed:', err);
    }
}

run();
