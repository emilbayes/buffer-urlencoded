# `buffer-urlencoded`

> Decode `application/x-www-form-urlencoded` Buffer into key/value Buffers

## Usage

```js
var parse = require('buffer-urlencoded')

var data = parse(Buffer.from('username=emil&password=secret'))

data.username // => <Buffer 73 65 63 72 65 74>
```

## API

### `var data = parse(buf, inplace = true)`
Parse `buf` into `{key: Buffer(value)}`, optionally copying the input `buf` so
the original data is not mutated. All bytes that become unreachable via keys of
the `data` object will be zeroed out. This means that if you zero out all values
in `data`, the original `buf` (or it's copy) will be all zeros. This is nice if
you don't want sensitive data floating around in memory (or as strings!).

## Install

```sh
npm install buffer-urlencoded
```

## License

[ISC](LICENSE.md)
