import { Response } from '../utils/index.js';
import CustomError from '../utils/CustomError.js';
import { uploadFile } from '../utils/fileStorage.js';

export const uploadController = {
  uploadFile: async (req, res, next) => {
    try {
      if (!req.file) throw CustomError.badRequest('No file uploaded');

      const uploaded = await uploadFile(req.file);

      Response(res, 'File uploaded successfully', {
        url: uploaded.url,
        thumbnail: uploaded.thumbnailUrl,
        fileId: uploaded.fileId,
      });
    } catch (e) {
      next(e);
    }
  },
};
