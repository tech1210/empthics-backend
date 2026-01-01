import multer from 'multer';

const storage = multer.memoryStorage(); // store in memory for ImageKit
export const upload = multer({ storage });
