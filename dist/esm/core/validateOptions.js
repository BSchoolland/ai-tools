function validateOptions(options, allowedParams, requiredParams = []) {
  for (let key of Object.keys(options)) {
    if (!allowedParams.has(key)) {
      throw new Error(`Unexpected parameter: '${key}'. Allowed parameters are: ${[...allowedParams].join(", ")}`);
    }
  }
  for (let key of requiredParams) {
    if (!options[key]) {
      throw new Error(`Required parameter: '${key}' is missing.`);
    }
  }
}
export {
  validateOptions
};
