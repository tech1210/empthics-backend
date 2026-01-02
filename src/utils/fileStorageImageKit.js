import ImageKit from 'imagekit';
import path from 'path';

const imagekit = new ImageKit({
  publicKey:
    process.env.IMAGEKIT_PUBLIC_KEY || 'public_fA3jJ5J1Fxzpg/hUoE1zXGt/oSU=',
  privateKey:
    process.env.IMAGEKIT_PRIVATE_KEY || 'private_IIIsHU6xrOl6Ga2VQXZtHy8k77o=',
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/emshrms',
});

/**
 * Upload file to ImageKit
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Name for the file
 * @param {String} folder - Folder in ImageKit (optional)
 */
export const uploadFile = async (file, folder = '/hrms_uploads') => {
  try {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const extension = path
      .extname(file.originalname)
      .toLowerCase()
      .replace('.', '');

    const key = `${uniqueName}.${extension}`;

    const response = await imagekit.upload({
      file: file.buffer, // can be buffer, base64, or URL
      fileName: key,
      folder,
    });
    return response; // contains url, thumbnailUrl, fileId etc.
  } catch (error) {
    throw error;
  }
};
