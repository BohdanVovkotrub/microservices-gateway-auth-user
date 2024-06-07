module.exports = (error, req, res, next) => {
  if (error.constructor.name === 'AxiosError') {
    if (!error.response) return next(error);
    const {message, errors} = error.response.data || {message: '', errors: []};
    return res.status(error.response.status).send({ message, errors });
  };
  return next(error);
}