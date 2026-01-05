import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/index.js';
// import { rateLimit } from 'express-rate-limit';
import * as crypto from 'crypto';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateAuthToken = async (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

export const generateEmailToken = () =>
  Buffer.from(Date.now() + Math.random().toString())
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 48);

export const Response = (res, message, data) =>
  res.json({
    status: 200,
    message,
    result: data,
  });

export const slugify = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// export const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 100,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   handler: (req, res) => {
//     res.status(429).json({
//       status: 429,
//       message: 'Too many requests, please try again later.',
//     });
//   },
// });

export const generateLoginId = () => {
  const bytes = crypto.randomBytes(6);
  let id = LETTERS[bytes[0] % LETTERS.length];

  for (let i = 1; i < 6; i++) {
    id += CHARSET[bytes[i] % CHARSET.length];
  }

  return id;
};
