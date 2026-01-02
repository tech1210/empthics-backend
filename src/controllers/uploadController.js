import { Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';
import { generatePresignedUrl } from '../utils/s3Upload.js';

export const uploadController = {
  uploadFile: async (req, res, next) => {
    try {
      if (!req.file) throw CustomError.badRequest('No file uploaded');

      Response(res, 'File uploaded successfully', {
        url: req.file.location, // normal S3 url
        key: req.file.key, // store in DB
        presignedUrl: req.file.presignedUrl, // secure URL
      });
    } catch (e) {
      next(e);
    }
  },

  getPresignedFromUrl: async (req, res, next) => {
    try {
      const { url } = req.query;
      const signedUrl = await generatePresignedUrl(url);

      Response(res, 'Signed URL generated', { signedUrl });
    } catch (e) {
      next(e);
    }
  },
};
