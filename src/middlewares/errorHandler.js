import CustomError from '../utils/CustomError.js';

const errorHandler = async (err, req, res, next) => {
  let status = 500;
  let message = err.message;

  if (err instanceof CustomError) {
    status = err.status;
  } else {
    message = 'Something went wrong!';
  }

  console.log('req.user', req?.user && req?.user?._id);
  console.log('body::', req.body);
  console.log('params::', req.params);
  console.log('query::', req.query);
  console.log('Error part::', err);

  return res.status(status).json({ status, message });
};

export default errorHandler;
