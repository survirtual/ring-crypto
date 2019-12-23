
# WebAssembly Crypto Library w/ Ring Signatures

Compilation of the Monero Crypto library to WebAssembly, with an easy to use Javascript interface.  Tested through the JS interface against Monero test cases.

This library was created to make a tested implementation of Ring Signatures readily available and easy to use.

Ring signatures are a key component in future secure democratic elections.

The WASM is bundled as a base64 buffer inline with the JS.  This increases the bundle size and causes a large slowdown on initial loading, but is very convenient for use.  It is recommended to load the WASM directly (this is currently not supported by this lib out of the box).

## Getting started


### Install the package
```
npm install @actor/crypto
```

### Import into your project
#### Javascript
```javascript
const crypto = require("@actor/crypto").Crypto;
```
#### Typescript
```typescript
import { Crypto } from "@actor/crypto";
```

**All samples to follow are in Typescript**

# API

## Random


--------------------------------------------------------

## Hash (Cryptonight Hash Function)
### Namespace: Crypto.Hash
### Methods
```typescript
Hash.data(buf: Buffer) : Promise<{
 hash: String
}>
```

Perform the Cryptonight Hash Function on the input Buffer.  Returns Hash object, with member hash of type String.

### Example
```typescript
const msg = "Hash me!";
const hash = (await Crypto.Hash.data(Buffer.from(msg))).hash;
```

--------------------------------------------------------

## SecretBox (Secret Key Encryption)

### Namespace: Crypto.SecretBox

Secret Box is used for synchronous, secret key encryption.  This can be used to encrypt data locally to be stored locally or remote safely.

### Methods

#### SecretBox.key
```typescript
SecretBox.key() : Promise<{
 sb_secret: Uint8Array
}>
```

Generates a key suitable for use in secret box encryption.  Returns SecretBoxSecret object, with member sb_secret of type Uint8Array.

#### SecretBox.box
```typescript
SecretBox.box(msg: Buffer, nonce: Buffer, secretKey: SecretBoxSecret) : Promise<Uint8Array>
```

Encrypts message using specified secret key and random nonce.  Returns Uint8Array of encrypted data.


#### SecretBox.unbox
```typescript
SecretBox.unbox(encryptedData: Buffer, nonce: Buffer, secretKey: SecretBoxSecret) : Promise<Uint8Array>
```

Decrypts message using specified secret key and random nonce.  Returns Uint8Array of unencrypted data.

##### Example
```typescript
const secretKey = await Crypto.SecretBox.key();
const msg = Buffer.from("box this message up");
const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

const box = await Crypto.SecretBox.box(msg, nonce, secretKey);

const unbox = await Crypto.SecretBox.open(box, nonce, secretKey);

const ourMsg = Buffer.from(unbox).toString("utf8");
```

--------------------------------------------------------

## Box (Shared Secret Key Encryption)

This can be used to setup secure comms between two parties. 

### Namespace: Crypto.Box

### Methods

#### Box.keyPair
```typescript
Box.keyPair() : Promise<{
 b_public_key: {
     b_public_data: Uint8Array
 },
 b_secret_key: {
     b_secret_data: Uint8Array
 }
}>
```

Generates a keyPair suitable for use in shared secret box encryption.  Returns BoxKeyPair object.

#### Box.sharedKey
```typescript
Box.sharedKey(remotePub: BoxPublicKey, localSec: BoxSecretKey) : Promise<{
    b_shared_secret: Uint8Array
}>
```

Derives a shared secret key using a box public key and a box secret key.  Returns a BoxSharedSecret object with member b_shared_secret of type Uint8Array.

#### Box.box
```typescript
Box.box(msg: Buffer, nonce: Buffer, sharedSecretKey: BoxSharedSecret) : Promise<Uint8Array>
```

Encrypts message using specified shared secret key and random nonce.  Returns Uint8Array of encrypted data.


#### Box.unbox
```typescript
Box.unbox(encryptedData: Buffer, nonce: Buffer, sharedSecretKey: BoxSharedSecret) : Promise<Uint8Array>
```

Decrypts message using specified shared secret key and random nonce.  Returns Uint8Array of unencrypted data.

### Example
```typescript
const keyPairA = await Crypto.Box.keyPair();
const keyPairB = await Crypto.Box.keyPair();
const sharedKeyA = await Crypto.Box.sharedKey(keyPairB.b_public_key, keyPairA.b_secret_key);
const sharedKeyB = await Crypto.Box.sharedKey(keyPairA.b_public_key, keyPairB.b_secret_key);

const msg = Buffer.from("box this message up");
const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

const box = await Crypto.Box.box(msg, nonce, sharedKeyA);

const unbox = await Crypto.Box.open(box, nonce, sharedKeyB);
```

--------------------------------------------------------

## Sign (ECC Signing)

Signing use Elliptic Curve Cryptography via curve Ed25519 

### Namespace: Crypto.Sign

### Methods

#### Sign.keyPair
```typescript
Sign.keyPair() : Promise<{
 s_public_key: {
     s_public_data: Uint8Array
 },
 s_secret_key: {
     s_secret_data: Uint8Array
 }
}>
```

Generates a keyPair suitable for use in signing and signature validation.  Returns SignKeyPair object.

#### Sign.sign
```typescript
Sign.sign(msg: Uint8Array, keyPair: SignKeyPair) : Promise<{
    s_sig: Uint8Array
}>
```

Signs a message buffer.  Returns a Signature object with member s_sig of type Uint8Array.

#### Sign.verify
```typescript
Sign.verify(msg: Uint8Array, pub: SignPublicKey, sig: Signature) : Promise<boolean>
```

Verifies message using specified public key and signature.  Returns true if valid, false if invalid.


### Example
```typescript
const keyPair = await Crypto.Sign.keyPair();
const msg = Buffer.from("sign me up!");
const sign = await Crypto.Sign.sign(msg, keyPair);
const valid = await Crypto.Sign.verify(msg, keyPair.s_public_key, sign);

```

--------------------------------------------------------

## Ring (Ring Signatures)

Ring Signatures for plausible deniability in message origination via ECC curve Ed25519

### Namespace: Crypto.Ring

### Methods

#### Ring.sign
```typescript
Ring.sign(msg: Uint8Array, secretKeyPair: SignKeyPair, ring: Array<SignPublicKey>) : Promise<{
    r_signature: Uint8Array,
    r_key_image: {
        r_key_image: Uint8Array
    }
}>
```

Generates a Ring Signature against a message buffer.  Returns a RingSignature object.

The KeyImage object may be used to link two signatures together.

#### Ring.verify
```typescript
Ring.verify(msg: Uint8Array, ring: Array<SignPublicKey>, ringSig: RingSignature) : Promise<boolean>
```

Verifies message using specified ring and ring signature.  Returns true if valid, false if invalid.


### Example
```typescript
const ringSize = 20;
const ring = [];
for (let i = 0; i < ringSize - 1; i++) {
    const keyPair = await Crypto.Sign.keyPair();
    ring.push(keyPair.s_public_key);
}
const secretKeyPair = await Crypto.Sign.keyPair();
ring.push(secretKeyPair.s_public_key);

const msg = Buffer.from("ring sign me!");
const ringSig = await Crypto.Ring.sign(msg, secretKeyPair, ring);

const valid = wait Crypto.Ring.verify(msg, ring, ringSig);

```

# For Contributors

Contributions from anyone are welcome.  If you see any bugs or can provide enhancements, please open an issue.

## Typescript + WASM

The primary language used is Typescript, with an ES5 target of NodeJS and Browsers.  After the transpilation step, the output is ran through Babel for flexible compatibility targets.  The crypto library is in C/C++ from the Monero project, with a WASM target.  The WASM is injected into bundled builds and is called via Typescript bindings.

## Building

### Prerequisites

This project relies on [EMSCRIPTEN](https://emscripten.org/) to function.  Follow the install instructions and install to a folder two levels above this folder.

Development has only been tested on Linux, but should be doable on any host OS with a few modifications.  The expectation for wasm builds is that the emscripten SDK is located two levels above this folder.  This can be modified by editing the build/wasm-build.ts "emsdk" variable.

## Testing

Testing is done using *mocha* and are located in the ```test``` sub-directory.  The tests run against the various levels of the JS interface.

```test/tests.txt``` contain a large suite of test cases used in the Monero project.  These tests are loaded in ```test/crypto-wasm.ts``` and are all run.

### To run tests
```
npm run test
```



## License

[GNU LESSER GENERAL PUBLIC LICENSE Version 3, 29 June 2007](https://www.gnu.org/licenses/lgpl-3.0.txt)

