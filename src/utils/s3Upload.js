import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import AWS from 'aws-sdk';
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
} from '../configs/index.js';

// ================= AWS CONFIG =================
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

// ================= Upload + Presigned URL =================
export const uploadS3File = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET_NAME,

    // 🔥 IMPORTANT: store correct Content-Type in S3
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: async function (req, file, cb) {
      try {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path
          .extname(file.originalname)
          .toLowerCase()
          .replace('.', '');
        const key = `${uniqueName}.${ext}`;

        // Presigned URL params
        const params = {
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Expires: 60 * 60 * 5, // 5 hours

          // 🔥 Force browser to open instead of download
          ResponseContentDisposition: 'inline',
        };

        // Optional Content-Type override if needed
        if (ext === 'pdf') params.ResponseContentType = 'application/pdf';
        else if (ext === 'jpg' || ext === 'jpeg')
          params.ResponseContentType = 'image/jpeg';
        else if (ext === 'png') params.ResponseContentType = 'image/png';
        else if (ext === 'pptx')
          params.ResponseContentType =
            'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (ext === 'docx')
          params.ResponseContentType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        // Generate presigned URL
        const presignedUrl = await s3.getSignedUrlPromise('getObject', params);

        file.presignedUrl = presignedUrl; // attach for controller
        cb(null, key);
      } catch (err) {
        console.error('Presigned URL Error:', err);
        cb(err);
      }
    },
  }),

  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ================= Generate Presigned URL For Existing Stored URL =================
export const generatePresignedUrl = async (
  storedUrl,
  expiresInSeconds = 60 * 10
) => {
  try {
    if (!storedUrl) return '';

    // 🔥 Safe key extraction (supports folders + CloudFront + query params)
    let key = storedUrl;

    if (storedUrl.includes('.amazonaws.com/')) {
      key = storedUrl.split('.amazonaws.com/')[1].split('?')[0];
    } else {
      // fallback if plain key stored
      key = storedUrl.split('/').pop();
    }

    key = decodeURIComponent(key);

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Expires: expiresInSeconds,

      // 🔥 again make sure OPEN not DOWNLOAD
      ResponseContentDisposition: 'inline',
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return '';
  }
};
