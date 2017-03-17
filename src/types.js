

function Int(dataField) {
  if (dataField % 1 !== 0) {
    throw new Error(`${dataField} is not Int`);
  }
}

module.exports = {
  Int,
};
