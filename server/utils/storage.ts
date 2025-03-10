import { Storage } from '@google-cloud/storage';
import { extname } from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS!)
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET!);

export async function uploadToGCS(file: Express.Multer.File): Promise<string> {
  const timestamp = Date.now();
  const extension = extname(file.originalname);
  const fileName = `thumbnails/${timestamp}${extension}`;

  const blob = bucket.file(fileName);
  const blobStream = blob.createWriteStream({
    resumable: false,
    gzip: true,
    metadata: {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000',
    },
    predefinedAcl: 'publicRead' // Use predefined ACL instead of makePublic()
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      // Generate a public URL without making the entire object public
      const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
}