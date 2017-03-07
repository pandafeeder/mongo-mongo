'use strict'

function Int (dataField) {
  if (dataField % 1 !== 0) {
    throw new Error(`${dataField} is not Int`)
  }
}

function Float(dataField) {
  if ((dataField % 1 === 0)&&(Math.floor(dataField) !== dataField)) {
    throw new Error(`${dataField} is not Float`)
  }
}

module.exports = exports = {
  Int: Int,
  Float: Float
}
