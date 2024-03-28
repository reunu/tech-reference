# Bluetooth log decoder

# Requirements

Node.js (see `.node-version`)

# Getting started

1. `npm install`
1. `npx ts-node ./decode.ts bluetooth-example.log`

# Example output

```
{
  '9a590065-6e67-5d0d-aab9-ad9126b66f91': [
    '��=',    '\x0B�=',
    '\x06�=', 'L�=',
    '\x17�=', 'Q�=',
    'o�=',    'b�=',
    ')�=',    '\x1C�=',
    '?�='
  ],
  '00002a00-0000-1000-8000-00805f9b34fb': [ 'unu Scooter' ],
  '9a590041-6e67-5d0d-aab9-ad9126b66f91': [ '\x1C(', 'M&', "\x02'", "*'", "�'", '\b(' ],
  '00002a04-0000-1000-8000-00805f9b34fb': [ '\x10<�\x01' ],
  '00002aa6-0000-1000-8000-00805f9b34fb': [ '\x01' ],
  '9a590021-6e67-5d0d-aab9-ad9126b66f91': [ 'off' ],
  '9a590022-6e67-5d0d-aab9-ad9126b66f91': [ 'closed' ],
  '9a590023-6e67-5d0d-aab9-ad9126b66f91': [ 'locked' ],
  '9a590061-6e67-5d0d-aab9-ad9126b66f91': [ 'P' ],
  '9a590063-6e67-5d0d-aab9-ad9126b66f91': [ '\b\x1FA\x01' ],
  '9a590064-6e67-5d0d-aab9-ad9126b66f91': [ '�/�\x01' ],
  '9a590072-6e67-5d0d-aab9-ad9126b66f91': [ 'not-charging' ],
  '9a590043-6e67-5d0d-aab9-ad9126b66f91': [ 'not-charging' ],
  '9a590101-6e67-5d0d-aab9-ad9126b66f91': [ 'cbb' ],
  '9a5900a1-6e67-5d0d-aab9-ad9126b66f91': [ 'hibernating' ],
  '9a5900e2-6e67-5d0d-aab9-ad9126b66f91': [ 'unknown' ],
  '9a5900ee-6e67-5d0d-aab9-ad9126b66f91': [ 'unknown' ],
  '9a59a001-6e67-5d0d-aab9-ad9126b66f91': [ 'v1.12.0' ]
}
```
