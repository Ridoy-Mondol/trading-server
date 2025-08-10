export const successResponse = (data: any, message = 'Success') => ({
  status: 'success',
  message,
  data,
});

export const errorResponse = (message = 'Error', status = 500) => ({
  status: 'error',
  message,
  statusCode: status,
});
