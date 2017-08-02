var assert = require('nanoassert')

var STATES = {
  KEY: 0,
  VALUE: 1
}

var CHARS = {
  AMP: 0x26,
  EQ: 0x3d,
  PLUS: 0x2b,
  SPACE: 0x20,

  PERC: 0x25
}

module.exports = function (buf, inplace) {
  assert(Buffer.isBuffer(buf), 'buf must be Buffer')
  if (inplace === false) buf = Buffer.from(buf)

  var map = {}

  var state = STATES.KEY

  var key = null
  var start = 0

  for (var i = 0, j = 0; i < buf.length; i++, j++) {
    var char = buf[i]

    if (state === STATES.KEY) {

      if (char === CHARS.EQ) {
        key = buf.slice(start, j)

        state = STATES.VALUE
        buf[i] = 0
        start = i + 1
        if (i > j) buf.fill(0, j, i)
        j = i

        continue
      }

      if (char === CHARS.AMP) {
        if (j > start) {
          key = buf.slice(start, j)
          map[key.toString()] = buf.slice(j, j)
          key.fill(0)
        }

        key = null
        state = STATES.KEY
        buf[i] = 0
        start = j + 1
        if (i > j) buf.fill(0, j, i)
        j = i

        continue
      }
    }

    if (state === STATES.VALUE) {
      if (char === CHARS.AMP) {
        map[key.toString()] = buf.slice(start, j)
        key.fill(0)

        key = null

        state = STATES.KEY
        buf[i] = 0
        start = i + 1
        if (i > j) buf.fill(0, j, i)
        j = i

        continue
      }
    }

    if (char === CHARS.PLUS) {
      buf[j] = CHARS.SPACE
      continue
    }

    if (char === CHARS.PERC && validHex(buf[i + 1]) && validHex(buf[i + 2])) {
      buf[j] = 16 * hexToDec(buf[i + 1]) + hexToDec(buf[i + 2])
      if (j > i) buf[i] = 0
      buf[i + 1] = 0
      buf[i + 2] = 0
      i += 2
      continue
    }

    if (i > j) {
      buf[j] = buf[i]
      continue
    }
  }

  if (key !== null || j > start) {
    if (state === STATES.KEY) {
      key = buf.slice(start, j)
      map[key.toString()] = buf.slice(j, j)
    }
    if (state === STATES.VALUE) map[key.toString()] = buf.slice(start, j)
    key.fill(0)
  }
  if (i > j) buf.fill(0, j, i)

  state = key = start = null

  return map
}

function validHex (char) {
  return 0x30 <= char && char <= 0x39 ||
         0x41 <= char && char <= 0x46 ||
         0x61 <= char && char <= 0x66
}

function hexToDec(char) {
  if (0x30 <= char && char <= 0x39) return char - 0x30
  if (0x41 <= char && char <= 0x46) return char - 0x41 + 10
  if (0x61 <= char && char <= 0x66) return char - 0x61 + 10
}
