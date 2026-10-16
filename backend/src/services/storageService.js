const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/materials');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const isS3Configured = Boolean(
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION
);

let s3Client = null;
if (isS3Configured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload a learning material file
 * @param {Object} file - Multer file object
 * @returns {Promise<{ fileUrl: string, fileKey: string, sizeBytes: number }>}
 */
async function uploadMaterialFile(file) {
  const timestamp = Date.now();
  const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `materials/${timestamp}-${sanitizedOriginalName}`;

  if (isS3Configured && s3Client) {
    // S3 Cloud Upload
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/pdf',
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    return {
      fileUrl,
      fileKey,
      sizeBytes: file.size,
    };
  }

  // Local Storage Fallback for Development
  const localFileName = `${timestamp}-${sanitizedOriginalName}`;
  const localFilePath = path.join(UPLOADS_DIR, localFileName);

  await fs.promises.writeFile(localFilePath, file.buffer);

  const fileUrl = `/uploads/materials/${localFileName}`;
  return {
    fileUrl,
    fileKey: localFileName,
    sizeBytes: file.size,
  };
}

/**
 * Delete a learning material file
 * @param {string} fileKey - Key or filename
 */
async function deleteMaterialFile(fileKey) {
  if (!fileKey) return;

  if (isS3Configured && s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      });
      await s3Client.send(command);
    } catch (err) {
      console.warn('Error deleting file from S3:', err.message);
    }
    return;
  }

  // Delete local file
  try {
    const localFilePath = path.join(UPLOADS_DIR, path.basename(fileKey));
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
  } catch (err) {
    console.warn('Error deleting local file:', err.message);
  }
}

module.exports = {
  uploadMaterialFile,
  deleteMaterialFile,
  isS3Configured,
};
