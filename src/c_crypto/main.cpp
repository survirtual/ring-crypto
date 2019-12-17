/* 
 * This library utilizes the work of Daniel Bernstein and colleagues:
 * - Bernard van Gastel
 * - Wesley Janssen
 * - Tanja Lange
 * - Peter Schwabe
 * - Sjaak Smetsers
 *
 * This library also utilizes the work from CryptoNote's implementation of ring signatures.
 * 
 * Compilation to WASM enabled by emscripten and binaryen.
 * 
 */

/*
 *  WASM stands for WebAssembly.
 *  Learn about WASM here:          https://webassembly.org/
 *
 *  The build process for this project uses emscripten + binaryen to compile C/C++ to WASM.
 *  Learn about emscripten here:    https://github.com/kripken/emscripten
 *  Learn about binaryen here:      https://github.com/WebAssembly/binaryen
 *
 * Security Warning:  WASM does not promise constant time and is vulnerable to attacks on memory.
 *
 */

#include "src/crypto.h"
#include "src/random.h"

extern "C" {
    #include "src/nacl.h"
}

#ifdef TEST_BUILD
extern "C" {
    void setup_test(void) {
        crypto::setup_random_test();
    }
}
#endif

static inline void random_scalar(crypto::ec_scalar &res) {
    crypto::random32_unbiased((unsigned char*)res.data);
}

extern "C" {
   /* NaCl API
    */
    int scalarmult_base(unsigned char *q, unsigned char *n) {
        return crypto_scalarmult_base(q, n);
    }

    // Secret Box
    int secretbox(unsigned char *c, unsigned char *m, unsigned long d, unsigned char *n, unsigned char *k) {
        return crypto_secretbox(c, m, d, n, k);
    }
    int secretbox_open(unsigned char *m, unsigned char *c, unsigned long d, unsigned char *n, unsigned char *k) {
        return crypto_secretbox_open(m, c, d, n, k);
    }

    // Box
    int box_keypair(unsigned char *y, unsigned char *x) {
        return crypto_box_keypair(y, x);
    }
    int box_beforenm(unsigned char *k, unsigned char *y, unsigned char *x) {
        return crypto_box_beforenm(k, y, x);
    }

   /* Sign and Ring-related crypto
    */
   /* 32-byte Uint8Array
    */
    void random_scalar(uint8_t* scalar) {
        random_scalar(*reinterpret_cast<crypto::ec_scalar*>(scalar));
    }
   /* {length}-byte Uint8Array, number,
    * 32-byte Uint8Array
    */
    void hash(const void *data, const size_t length,
    char* hash) {
        crypto::cn_fast_hash(data, length, hash);
    }

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array
    */
    void generate_keys(uint8_t* sec, uint8_t* pub) {
        crypto::generate_keys(
            *reinterpret_cast<crypto::public_key*>(pub), 
            *reinterpret_cast<crypto::secret_key*>(sec)
        );
    }

   /* 32-byte Uint8Array,
    */
    bool check_key(uint8_t* pub) {
        return crypto::check_key(*reinterpret_cast<crypto::public_key*>(pub));
    }

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array
    */
    bool secret_key_to_public_key(uint8_t* sec, uint8_t* pub) {
        // Returns false on invalid SK input
        bool ret = crypto::secret_key_to_public_key(
            *reinterpret_cast<crypto::secret_key*>(sec),
            *reinterpret_cast<crypto::public_key*>(pub)
        );
        return ret;
    }

   /* Standard signatures
    */

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * 64-byte Uint8Array
    */
    void generate_signature(uint8_t* prefix_hash, uint8_t* sec, uint8_t* pub, uint8_t* sig) {
        crypto::generate_signature(
            *reinterpret_cast<crypto::Hash*>(prefix_hash),
            *reinterpret_cast<crypto::public_key*>(pub),
            *reinterpret_cast<crypto::secret_key*>(sec),
            *reinterpret_cast<crypto::signature*>(sig)
        );
    }

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * 64-byte Uint8Array
    */
    bool check_signature(uint8_t* prefix_hash, uint8_t* pub, uint8_t* sig) {
        return crypto::check_signature(
            *reinterpret_cast<crypto::Hash*>(prefix_hash),
            *reinterpret_cast<crypto::public_key*>(pub),
            *reinterpret_cast<crypto::signature*>(sig)
        );
    }


   /* Ring signatures
    */

   /* 
    * https://monero.stackexchange.com/questions/2883/what-is-a-key-image
    * 
    * Summary: only need to publish key image, guarding public key identity
    */
   /* 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * 32-byte Uint8Array
    */
    void generate_key_image(uint8_t* pub, uint8_t* sec, uint8_t* image) {
        crypto::generate_key_image(
            *reinterpret_cast<crypto::public_key*>(pub),
            *reinterpret_cast<crypto::secret_key*>(sec), 
            *reinterpret_cast<crypto::key_image*>(image)
        );
    }

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * {pubs_count} * 32-byte Uint8Array[], number
    * 32-byte Uint8Array, number,
    * {pubs_count} * 64-byte Uint8Array[]
    */
    void generate_ring_signature(uint8_t* prefix_hash, uint8_t* image,
    uint8_t* pubs, size_t pubs_count,
    uint8_t* sec, size_t sec_index,
    uint8_t* ringSig) {
        crypto::generate_ring_signature(
            *reinterpret_cast<crypto::Hash*>(prefix_hash),
            *reinterpret_cast<crypto::key_image*>(image),
            reinterpret_cast<crypto::public_key*>(pubs),
            pubs_count,
            *reinterpret_cast<crypto::secret_key*>(sec),
            sec_index,
            reinterpret_cast<crypto::signature*>(ringSig)
        );
    }

   /* 32-byte Uint8Array,
    * 32-byte Uint8Array,
    * {pubs_count} * 32-byte Uint8Array[], number
    * {pubs_count} * 64-byte Uint8Array[]
    */
    bool check_ring_signature(uint8_t* prefix_hash, uint8_t* image,
    uint8_t* pubs, size_t pubs_count,
    uint8_t* ringSig) {
        return crypto::check_ring_signature(
            *reinterpret_cast<crypto::Hash*>(prefix_hash),
            *reinterpret_cast<crypto::key_image*>(image),
            reinterpret_cast<crypto::public_key*>(pubs),
            pubs_count,
            reinterpret_cast<crypto::signature*>(ringSig)
        );
    }
}
