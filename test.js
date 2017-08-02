var test = require('tape')
var parse = require('.')

// Edge cases
// * No value 'key'
// * No bytes 'key1&&key2'
// * Empty key '=value'
// * Empty value 'key='
// * Value contains = 'key=val=ue'
// * Key contains +
// * Value contains +
// * Percent encoded
// * Repeat keys

test('simple test', function (assert) {
  assert.deepEqual(parse(Buffer.from('password=secret')), {password: Buffer.from('secret')})
  assert.end()
})

test('simple test with two keys', function (assert) {
  assert.deepEquals(parse(Buffer.from('password=secret&username=emil')), {password: Buffer.from('secret'), username: Buffer.from('emil')})
  assert.end()
})

test('No value', function (assert) {
  assert.deepEqual(parse(Buffer.from('username')), {username: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('username&foo=bar')), {username: Buffer.from(''), foo: Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('foo=bar&username')), {foo: Buffer.from('bar'), username: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('foo=bar&username&baz=qux')), {foo: Buffer.from('bar'), username: Buffer.from(''), baz: Buffer.from('qux')})
  assert.end()
})

test('No bytes', function (assert) {
  assert.deepEqual(parse(Buffer.from('')), {})
  assert.deepEqual(parse(Buffer.from('&')), {})
  assert.deepEqual(parse(Buffer.from('&&')), {})
  assert.deepEqual(parse(Buffer.from('foo=bar&')), {foo: Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('&bar=baz')), {bar: Buffer.from('baz')})
  assert.deepEqual(parse(Buffer.from('foo=bar&&bar=baz')), {foo: Buffer.from('bar'), bar: Buffer.from('baz')})
  assert.end()
})

test('Empty key', function (assert) {
  assert.deepEqual(parse(Buffer.from('=bar')), {'': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('&=bar')), {'': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('=bar&=baz')), {'': Buffer.from('baz')})
  assert.deepEqual(parse(Buffer.from('foo&=baz')), {foo: Buffer.from(''), '': Buffer.from('baz')})
  assert.deepEqual(parse(Buffer.from('=baz&foo')), {'': Buffer.from('baz'), foo: Buffer.from('')})
  assert.end()
})

test('Empty value', function (assert) {
  assert.deepEqual(parse(Buffer.from('bar=')), {bar: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('&bar=')), {bar: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('bar=&baz=')), {bar: Buffer.from(''), baz: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('bar=&=baz')), {bar: Buffer.from(''), '': Buffer.from('baz')})
  assert.deepEqual(parse(Buffer.from('foo&baz=')), {foo: Buffer.from(''), baz: Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('baz=&foo')), {baz: Buffer.from(''), foo: Buffer.from('')})
  assert.end()
})

test('Value contains =', function (assert) {
  assert.deepEqual(parse(Buffer.from('==')), {'': Buffer.from('=')})
  assert.deepEqual(parse(Buffer.from('foo==')), {foo: Buffer.from('=')})
  assert.deepEqual(parse(Buffer.from('foo=ba=z')), {foo: Buffer.from('ba=z')})
  assert.deepEqual(parse(Buffer.from('foo=baz=')), {foo: Buffer.from('baz=')})
  assert.deepEqual(parse(Buffer.from('foo==baz')), {foo: Buffer.from('=baz')})
  assert.deepEqual(parse(Buffer.from('foo==baz&test=bad')), {foo: Buffer.from('=baz'), test: Buffer.from('bad')})
  assert.deepEqual(parse(Buffer.from('test=&foo==baz')), {test: Buffer.from(''), foo: Buffer.from('=baz')})
  assert.end()
})

test('Key contains +', function (assert) {
  assert.deepEqual(parse(Buffer.from('f+o')), {'f o': Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('+')), {' ': Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('foo+')), {'foo ': Buffer.from('')})
  assert.deepEqual(parse(Buffer.from('foo+=bar')), {'foo ': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('f+o=bar')), {'f o': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('+foo=bar')), {' foo': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('bar&+foo=bar')), {'bar': Buffer.from(''), ' foo': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('bar=baz&+foo=bar')), {'bar': Buffer.from('baz'), ' foo': Buffer.from('bar')})
  assert.deepEqual(parse(Buffer.from('+foo=bar&bar=baz')), {' foo': Buffer.from('bar'), 'bar': Buffer.from('baz')})
  assert.end()
})

test('Value contains +', function (assert) {
  assert.deepEqual(parse(Buffer.from('=f+o')), {'': Buffer.from('f o')})
  assert.deepEqual(parse(Buffer.from('=+')), {'': Buffer.from(' ')})
  assert.deepEqual(parse(Buffer.from('=foo+')), {'': Buffer.from('foo ')})
  assert.deepEqual(parse(Buffer.from('bar=foo+')), {'bar': Buffer.from('foo ')})
  assert.deepEqual(parse(Buffer.from('bar=f+o')), {'bar': Buffer.from('f o')})
  assert.deepEqual(parse(Buffer.from('bar=+foo')), {'bar': Buffer.from(' foo')})
  assert.deepEqual(parse(Buffer.from('bar&baz=+foo')), {'bar': Buffer.from(''), 'baz': Buffer.from(' foo')})
  assert.deepEqual(parse(Buffer.from('bar=baz&baz=+foo')), {'bar': Buffer.from('baz'), 'baz': Buffer.from(' foo')})
  assert.deepEqual(parse(Buffer.from('baz=+++++f+o+o++++++&bar=baz')), {baz: Buffer.from('     f o o      '), 'bar': Buffer.from('baz')})

  assert.deepEqual(parse(Buffer.from('bar=baz&baz=+=+=foo+=')), {bar: Buffer.from('baz'), baz: Buffer.from(' = =foo =')})

  assert.end()
})

test('Contains percent encoded', function (assert) {
  var buf1 = Buffer.from('Hello+%2B%2B+%2B%2B=Hi%2B%2B+&foo=bar')
  var data1 = parse(buf1)
  assert.deepEqual(data1, {'Hello ++ ++': Buffer.from('Hi++ '), foo: Buffer.from('bar')})
  Object.keys(data1).forEach(function (k) {
    data1[k].fill(0)
  })
  assert.deepEqual(buf1, Buffer.alloc(buf1.length))


  var buf2 = Buffer.from('JavaScript_%D1%88%D0%B5%D0%BB+%D0%BB%D1%8Bj=JavaScript_%D1%88%D0%B5%D0%BB+%D0%BB%D1%8Bj')

  var data2 = parse(buf2)
  assert.deepEqual(data2, {'JavaScript_шел лыj': Buffer.from('JavaScript_шел лыj')})

  Object.keys(data2).forEach(function (k) {
    data2[k].fill(0)
  })

  assert.deepEqual(buf2, Buffer.alloc(buf2.length))

  assert.end()
})


test('', function (assert) {
  assert.deepEqual(parse(Buffer.from('%2Bj')), {'+j': Buffer.from('')})
  assert.end()
})
