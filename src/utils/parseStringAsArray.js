module.exports = function parseStringAsArray(arrayAsString) {
  return arrayAsString.split(',').map(t => t.trim());
};
