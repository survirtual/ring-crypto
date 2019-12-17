
#include "random.h"

#include "nacl.h"

typedef unsigned int uint32;
static const unsigned char sigma[16] = "expand 32-byte k";
const unsigned char base[32] = {9};
static const unsigned char n[16] = {0};

void randombytes(unsigned char *bytes, unsigned long long N)
{
    generate_random_bytes_not_thread_safe(N, bytes);
}

static void add(unsigned int out[32], const unsigned int a[32], const unsigned int b[32])
{
    unsigned int j;
    unsigned int u;
    u = 0;
    for (j = 0; j < 31; ++j)
    {
        u += a[j] + b[j];
        out[j] = u & 255;
        u >>= 8;
    }
    u += a[31] + b[31];
    out[31] = u;
}

static void sub(unsigned int out[32], const unsigned int a[32], const unsigned int b[32])
{
    unsigned int j;
    unsigned int u;
    u = 218;
    for (j = 0; j < 31; ++j)
    {
        u += a[j] + 65280 - b[j];
        out[j] = u & 255;
        u >>= 8;
    }
    u += a[31] - b[31];
    out[31] = u;
}

static void squeeze(unsigned int a[32])
{
    unsigned int j;
    unsigned int u;
    u = 0;
    for (j = 0; j < 31; ++j)
    {
        u += a[j];
        a[j] = u & 255;
        u >>= 8;
    }
    u += a[31];
    a[31] = u & 127;
    u = 19 * (u >> 7);
    for (j = 0; j < 31; ++j)
    {
        u += a[j];
        a[j] = u & 255;
        u >>= 8;
    }
    u += a[31];
    a[31] = u;
}

static const unsigned int minusp[32] = {
    19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128};

static void freeze(unsigned int a[32])
{
    unsigned int aorig[32];
    unsigned int j;
    unsigned int negative;

    for (j = 0; j < 32; ++j)
        aorig[j] = a[j];
    add(a, a, minusp);
    negative = -((a[31] >> 7) & 1);
    for (j = 0; j < 32; ++j)
        a[j] ^= negative & (aorig[j] ^ a[j]);
}

static void mult(unsigned int out[32], const unsigned int a[32], const unsigned int b[32])
{
    unsigned int i;
    unsigned int j;
    unsigned int u;

    for (i = 0; i < 32; ++i)
    {
        u = 0;
        for (j = 0; j <= i; ++j)
            u += a[j] * b[i - j];
        for (j = i + 1; j < 32; ++j)
            u += 38 * a[j] * b[i + 32 - j];
        out[i] = u;
    }
    squeeze(out);
}

static void mult121665(unsigned int out[32], const unsigned int a[32])
{
    unsigned int j;
    unsigned int u;

    u = 0;
    for (j = 0; j < 31; ++j)
    {
        u += 121665 * a[j];
        out[j] = u & 255;
        u >>= 8;
    }
    u += 121665 * a[31];
    out[31] = u & 127;
    u = 19 * (u >> 7);
    for (j = 0; j < 31; ++j)
    {
        u += out[j];
        out[j] = u & 255;
        u >>= 8;
    }
    u += out[j];
    out[j] = u;
}

static void square(unsigned int out[32], const unsigned int a[32])
{
    unsigned int i;
    unsigned int j;
    unsigned int u;

    for (i = 0; i < 32; ++i)
    {
        u = 0;
        for (j = 0; j < i - j; ++j)
            u += a[j] * a[i - j];
        for (j = i + 1; j < i + 32 - j; ++j)
            u += 38 * a[j] * a[i + 32 - j];
        u *= 2;
        if ((i & 1) == 0)
        {
            u += a[i / 2] * a[i / 2];
            u += 38 * a[i / 2 + 16] * a[i / 2 + 16];
        }
        out[i] = u;
    }
    squeeze(out);
}

static void select(unsigned int p[64], unsigned int q[64], const unsigned int r[64], const unsigned int s[64], unsigned int b)
{
    unsigned int j;
    unsigned int t;
    unsigned int bminus1;

    bminus1 = b - 1;
    for (j = 0; j < 64; ++j)
    {
        t = bminus1 & (r[j] ^ s[j]);
        p[j] = s[j] ^ t;
        q[j] = r[j] ^ t;
    }
}

static void mainloop(unsigned int work[64], const unsigned char e[32])
{
    unsigned int xzm1[64];
    unsigned int xzm[64];
    unsigned int xzmb[64];
    unsigned int xzm1b[64];
    unsigned int xznb[64];
    unsigned int xzn1b[64];
    unsigned int a0[64];
    unsigned int a1[64];
    unsigned int b0[64];
    unsigned int b1[64];
    unsigned int c1[64];
    unsigned int r[32];
    unsigned int s[32];
    unsigned int t[32];
    unsigned int u[32];
    unsigned int i;
    unsigned int j;
    unsigned int b;
    int pos;

    for (j = 0; j < 32; ++j)
        xzm1[j] = work[j];
    xzm1[32] = 1;
    for (j = 33; j < 64; ++j)
        xzm1[j] = 0;

    xzm[0] = 1;
    for (j = 1; j < 64; ++j)
        xzm[j] = 0;

    for (pos = 254; pos >= 0; --pos)
    {
        b = e[pos / 8] >> (pos & 7);
        b &= 1;
        select(xzmb, xzm1b, xzm, xzm1, b);
        add(a0, xzmb, xzmb + 32);
        sub(a0 + 32, xzmb, xzmb + 32);
        add(a1, xzm1b, xzm1b + 32);
        sub(a1 + 32, xzm1b, xzm1b + 32);
        square(b0, a0);
        square(b0 + 32, a0 + 32);
        mult(b1, a1, a0 + 32);
        mult(b1 + 32, a1 + 32, a0);
        add(c1, b1, b1 + 32);
        sub(c1 + 32, b1, b1 + 32);
        square(r, c1 + 32);
        sub(s, b0, b0 + 32);
        mult121665(t, s);
        add(u, t, b0);
        mult(xznb, b0, b0 + 32);
        mult(xznb + 32, s, u);
        square(xzn1b, c1);
        mult(xzn1b + 32, r, work);
        select(xzm, xzm1, xznb, xzn1b, b);
    }

    for (j = 0; j < 64; ++j)
        work[j] = xzm[j];
}

static void recip(unsigned int out[32], const unsigned int z[32])
{
    unsigned int z2[32];
    unsigned int z9[32];
    unsigned int z11[32];
    unsigned int z2_5_0[32];
    unsigned int z2_10_0[32];
    unsigned int z2_20_0[32];
    unsigned int z2_50_0[32];
    unsigned int z2_100_0[32];
    unsigned int t0[32];
    unsigned int t1[32];
    int i;

    /* 2 */ square(z2, z);
    /* 4 */ square(t1, z2);
    /* 8 */ square(t0, t1);
    /* 9 */ mult(z9, t0, z);
    /* 11 */ mult(z11, z9, z2);
    /* 22 */ square(t0, z11);
    /* 2^5 - 2^0 = 31 */ mult(z2_5_0, t0, z9);

    /* 2^6 - 2^1 */ square(t0, z2_5_0);
    /* 2^7 - 2^2 */ square(t1, t0);
    /* 2^8 - 2^3 */ square(t0, t1);
    /* 2^9 - 2^4 */ square(t1, t0);
    /* 2^10 - 2^5 */ square(t0, t1);
    /* 2^10 - 2^0 */ mult(z2_10_0, t0, z2_5_0);

    /* 2^11 - 2^1 */ square(t0, z2_10_0);
    /* 2^12 - 2^2 */ square(t1, t0);
    /* 2^20 - 2^10 */ for (i = 2; i < 10; i += 2)
    {
        square(t0, t1);
        square(t1, t0);
    }
    /* 2^20 - 2^0 */ mult(z2_20_0, t1, z2_10_0);

    /* 2^21 - 2^1 */ square(t0, z2_20_0);
    /* 2^22 - 2^2 */ square(t1, t0);
    /* 2^40 - 2^20 */ for (i = 2; i < 20; i += 2)
    {
        square(t0, t1);
        square(t1, t0);
    }
    /* 2^40 - 2^0 */ mult(t0, t1, z2_20_0);

    /* 2^41 - 2^1 */ square(t1, t0);
    /* 2^42 - 2^2 */ square(t0, t1);
    /* 2^50 - 2^10 */ for (i = 2; i < 10; i += 2)
    {
        square(t1, t0);
        square(t0, t1);
    }
    /* 2^50 - 2^0 */ mult(z2_50_0, t0, z2_10_0);

    /* 2^51 - 2^1 */ square(t0, z2_50_0);
    /* 2^52 - 2^2 */ square(t1, t0);
    /* 2^100 - 2^50 */ for (i = 2; i < 50; i += 2)
    {
        square(t0, t1);
        square(t1, t0);
    }
    /* 2^100 - 2^0 */ mult(z2_100_0, t1, z2_50_0);

    /* 2^101 - 2^1 */ square(t1, z2_100_0);
    /* 2^102 - 2^2 */ square(t0, t1);
    /* 2^200 - 2^100 */ for (i = 2; i < 100; i += 2)
    {
        square(t1, t0);
        square(t0, t1);
    }
    /* 2^200 - 2^0 */ mult(t1, t0, z2_100_0);

    /* 2^201 - 2^1 */ square(t0, t1);
    /* 2^202 - 2^2 */ square(t1, t0);
    /* 2^250 - 2^50 */ for (i = 2; i < 50; i += 2)
    {
        square(t0, t1);
        square(t1, t0);
    }
    /* 2^250 - 2^0 */ mult(t0, t1, z2_50_0);

    /* 2^251 - 2^1 */ square(t1, t0);
    /* 2^252 - 2^2 */ square(t0, t1);
    /* 2^253 - 2^3 */ square(t1, t0);
    /* 2^254 - 2^4 */ square(t0, t1);
    /* 2^255 - 2^5 */ square(t1, t0);
    /* 2^255 - 21 */ mult(out, t1, z11);
}

int crypto_scalarmult_base(unsigned char *q,
                           const unsigned char *n)
{
    return crypto_scalarmult(q, n, base);
}

int crypto_scalarmult(unsigned char *q,
                      const unsigned char *n,
                      const unsigned char *p)
{
    unsigned int work[96];
    unsigned char e[32];
    unsigned int i;
    for (i = 0; i < 32; ++i)
        e[i] = n[i];
    e[0] &= 248;
    e[31] &= 127;
    e[31] |= 64;
    for (i = 0; i < 32; ++i)
        work[i] = p[i];
    mainloop(work, e);
    recip(work + 32, work + 32);
    mult(work + 64, work, work + 32);
    freeze(work + 64);
    for (i = 0; i < 32; ++i)
        q[i] = work[64 + i];
    return 0;
}

static uint32 rotate(uint32 u, int c)
{
    return (u << c) | (u >> (32 - c));
}

static uint32 load_littleendian(const unsigned char *x)
{
    return (uint32)(x[0]) | (((uint32)(x[1])) << 8) | (((uint32)(x[2])) << 16) | (((uint32)(x[3])) << 24);
}

static void store_littleendian(unsigned char *x, uint32 u)
{
    x[0] = u;
    u >>= 8;
    x[1] = u;
    u >>= 8;
    x[2] = u;
    u >>= 8;
    x[3] = u;
}

int crypto_core_salsa20(
    unsigned char *out,
    const unsigned char *in,
    const unsigned char *k,
    const unsigned char *c)
{
    uint32 x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14, x15;
    uint32 j0, j1, j2, j3, j4, j5, j6, j7, j8, j9, j10, j11, j12, j13, j14, j15;
    int i;

    j0 = x0 = load_littleendian(c + 0);
    j1 = x1 = load_littleendian(k + 0);
    j2 = x2 = load_littleendian(k + 4);
    j3 = x3 = load_littleendian(k + 8);
    j4 = x4 = load_littleendian(k + 12);
    j5 = x5 = load_littleendian(c + 4);
    j6 = x6 = load_littleendian(in + 0);
    j7 = x7 = load_littleendian(in + 4);
    j8 = x8 = load_littleendian(in + 8);
    j9 = x9 = load_littleendian(in + 12);
    j10 = x10 = load_littleendian(c + 8);
    j11 = x11 = load_littleendian(k + 16);
    j12 = x12 = load_littleendian(k + 20);
    j13 = x13 = load_littleendian(k + 24);
    j14 = x14 = load_littleendian(k + 28);
    j15 = x15 = load_littleendian(c + 12);

    for (i = ROUNDS; i > 0; i -= 2)
    {
        x4 ^= rotate(x0 + x12, 7);
        x8 ^= rotate(x4 + x0, 9);
        x12 ^= rotate(x8 + x4, 13);
        x0 ^= rotate(x12 + x8, 18);
        x9 ^= rotate(x5 + x1, 7);
        x13 ^= rotate(x9 + x5, 9);
        x1 ^= rotate(x13 + x9, 13);
        x5 ^= rotate(x1 + x13, 18);
        x14 ^= rotate(x10 + x6, 7);
        x2 ^= rotate(x14 + x10, 9);
        x6 ^= rotate(x2 + x14, 13);
        x10 ^= rotate(x6 + x2, 18);
        x3 ^= rotate(x15 + x11, 7);
        x7 ^= rotate(x3 + x15, 9);
        x11 ^= rotate(x7 + x3, 13);
        x15 ^= rotate(x11 + x7, 18);
        x1 ^= rotate(x0 + x3, 7);
        x2 ^= rotate(x1 + x0, 9);
        x3 ^= rotate(x2 + x1, 13);
        x0 ^= rotate(x3 + x2, 18);
        x6 ^= rotate(x5 + x4, 7);
        x7 ^= rotate(x6 + x5, 9);
        x4 ^= rotate(x7 + x6, 13);
        x5 ^= rotate(x4 + x7, 18);
        x11 ^= rotate(x10 + x9, 7);
        x8 ^= rotate(x11 + x10, 9);
        x9 ^= rotate(x8 + x11, 13);
        x10 ^= rotate(x9 + x8, 18);
        x12 ^= rotate(x15 + x14, 7);
        x13 ^= rotate(x12 + x15, 9);
        x14 ^= rotate(x13 + x12, 13);
        x15 ^= rotate(x14 + x13, 18);
    }

    x0 += j0;
    x1 += j1;
    x2 += j2;
    x3 += j3;
    x4 += j4;
    x5 += j5;
    x6 += j6;
    x7 += j7;
    x8 += j8;
    x9 += j9;
    x10 += j10;
    x11 += j11;
    x12 += j12;
    x13 += j13;
    x14 += j14;
    x15 += j15;

    store_littleendian(out + 0, x0);
    store_littleendian(out + 4, x1);
    store_littleendian(out + 8, x2);
    store_littleendian(out + 12, x3);
    store_littleendian(out + 16, x4);
    store_littleendian(out + 20, x5);
    store_littleendian(out + 24, x6);
    store_littleendian(out + 28, x7);
    store_littleendian(out + 32, x8);
    store_littleendian(out + 36, x9);
    store_littleendian(out + 40, x10);
    store_littleendian(out + 44, x11);
    store_littleendian(out + 48, x12);
    store_littleendian(out + 52, x13);
    store_littleendian(out + 56, x14);
    store_littleendian(out + 60, x15);

    return 0;
}

int crypto_core_hsalsa20(
    unsigned char *out,
    const unsigned char *in,
    const unsigned char *k,
    const unsigned char *c)
{
    uint32 x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14, x15;
    uint32 j0, j1, j2, j3, j4, j5, j6, j7, j8, j9, j10, j11, j12, j13, j14, j15;
    int i;

    j0 = x0 = load_littleendian(c + 0);
    j1 = x1 = load_littleendian(k + 0);
    j2 = x2 = load_littleendian(k + 4);
    j3 = x3 = load_littleendian(k + 8);
    j4 = x4 = load_littleendian(k + 12);
    j5 = x5 = load_littleendian(c + 4);
    j6 = x6 = load_littleendian(in + 0);
    j7 = x7 = load_littleendian(in + 4);
    j8 = x8 = load_littleendian(in + 8);
    j9 = x9 = load_littleendian(in + 12);
    j10 = x10 = load_littleendian(c + 8);
    j11 = x11 = load_littleendian(k + 16);
    j12 = x12 = load_littleendian(k + 20);
    j13 = x13 = load_littleendian(k + 24);
    j14 = x14 = load_littleendian(k + 28);
    j15 = x15 = load_littleendian(c + 12);

    for (i = ROUNDS; i > 0; i -= 2)
    {
        x4 ^= rotate(x0 + x12, 7);
        x8 ^= rotate(x4 + x0, 9);
        x12 ^= rotate(x8 + x4, 13);
        x0 ^= rotate(x12 + x8, 18);
        x9 ^= rotate(x5 + x1, 7);
        x13 ^= rotate(x9 + x5, 9);
        x1 ^= rotate(x13 + x9, 13);
        x5 ^= rotate(x1 + x13, 18);
        x14 ^= rotate(x10 + x6, 7);
        x2 ^= rotate(x14 + x10, 9);
        x6 ^= rotate(x2 + x14, 13);
        x10 ^= rotate(x6 + x2, 18);
        x3 ^= rotate(x15 + x11, 7);
        x7 ^= rotate(x3 + x15, 9);
        x11 ^= rotate(x7 + x3, 13);
        x15 ^= rotate(x11 + x7, 18);
        x1 ^= rotate(x0 + x3, 7);
        x2 ^= rotate(x1 + x0, 9);
        x3 ^= rotate(x2 + x1, 13);
        x0 ^= rotate(x3 + x2, 18);
        x6 ^= rotate(x5 + x4, 7);
        x7 ^= rotate(x6 + x5, 9);
        x4 ^= rotate(x7 + x6, 13);
        x5 ^= rotate(x4 + x7, 18);
        x11 ^= rotate(x10 + x9, 7);
        x8 ^= rotate(x11 + x10, 9);
        x9 ^= rotate(x8 + x11, 13);
        x10 ^= rotate(x9 + x8, 18);
        x12 ^= rotate(x15 + x14, 7);
        x13 ^= rotate(x12 + x15, 9);
        x14 ^= rotate(x13 + x12, 13);
        x15 ^= rotate(x14 + x13, 18);
    }

    x0 += j0;
    x1 += j1;
    x2 += j2;
    x3 += j3;
    x4 += j4;
    x5 += j5;
    x6 += j6;
    x7 += j7;
    x8 += j8;
    x9 += j9;
    x10 += j10;
    x11 += j11;
    x12 += j12;
    x13 += j13;
    x14 += j14;
    x15 += j15;

    x0 -= load_littleendian(c + 0);
    x5 -= load_littleendian(c + 4);
    x10 -= load_littleendian(c + 8);
    x15 -= load_littleendian(c + 12);
    x6 -= load_littleendian(in + 0);
    x7 -= load_littleendian(in + 4);
    x8 -= load_littleendian(in + 8);
    x9 -= load_littleendian(in + 12);

    store_littleendian(out + 0, x0);
    store_littleendian(out + 4, x5);
    store_littleendian(out + 8, x10);
    store_littleendian(out + 12, x15);
    store_littleendian(out + 16, x6);
    store_littleendian(out + 20, x7);
    store_littleendian(out + 24, x8);
    store_littleendian(out + 28, x9);

    return 0;
}

int crypto_stream_salsa20(
    unsigned char *c, unsigned long long clen,
    const unsigned char *n,
    const unsigned char *k)
{
    unsigned char in[16];
    unsigned char block[64];
    int i;
    unsigned int u;

    if (!clen)
        return 0;

    for (i = 0; i < 8; ++i)
        in[i] = n[i];
    for (i = 8; i < 16; ++i)
        in[i] = 0;

    while (clen >= 64)
    {
        crypto_core_salsa20(c, in, k, sigma);

        u = 1;
        for (i = 8; i < 16; ++i)
        {
            u += (unsigned int)in[i];
            in[i] = u;
            u >>= 8;
        }

        clen -= 64;
        c += 64;
    }

    if (clen)
    {
        crypto_core_salsa20(block, in, k, sigma);
        for (i = 0; i < clen; ++i)
            c[i] = block[i];
    }
    return 0;
}

int crypto_stream_salsa20_xor(
    unsigned char *c,
    const unsigned char *m, unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *k)
{
    unsigned char in[16];
    unsigned char block[64];
    int i;
    unsigned int u;

    if (!mlen)
        return 0;

    for (i = 0; i < 8; ++i)
        in[i] = n[i];
    for (i = 8; i < 16; ++i)
        in[i] = 0;

    while (mlen >= 64)
    {
        crypto_core_salsa20(block, in, k, sigma);
        for (i = 0; i < 64; ++i)
            c[i] = m[i] ^ block[i];

        u = 1;
        for (i = 8; i < 16; ++i)
        {
            u += (unsigned int)in[i];
            in[i] = u;
            u >>= 8;
        }

        mlen -= 64;
        c += 64;
        m += 64;
    }

    if (mlen)
    {
        crypto_core_salsa20(block, in, k, sigma);
        for (i = 0; i < mlen; ++i)
            c[i] = m[i] ^ block[i];
    }
    return 0;
}

int crypto_stream_xsalsa20_xor(
    unsigned char *c,
    const unsigned char *m, unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *k)
{
    unsigned char subkey[32];
    crypto_core_hsalsa20(subkey, n, k, sigma);
    return crypto_stream_salsa20_xor(c, m, mlen, n + 16, subkey);
}

int crypto_stream_xsalsa20(
    unsigned char *c, unsigned long long clen,
    const unsigned char *n,
    const unsigned char *k)
{
    unsigned char subkey[32];
    crypto_core_hsalsa20(subkey, n, k, sigma);
    return crypto_stream_salsa20(c, clen, n + 16, subkey);
}

static void add_poly1305(unsigned int h[17], const unsigned int c[17])
{
    unsigned int j;
    unsigned int u;
    u = 0;
    for (j = 0; j < 17; ++j)
    {
        u += h[j] + c[j];
        h[j] = u & 255;
        u >>= 8;
    }
}

static void squeeze_poly1305(unsigned int h[17])
{
    unsigned int j;
    unsigned int u;
    u = 0;
    for (j = 0; j < 16; ++j)
    {
        u += h[j];
        h[j] = u & 255;
        u >>= 8;
    }
    u += h[16];
    h[16] = u & 3;
    u = 5 * (u >> 2);
    for (j = 0; j < 16; ++j)
    {
        u += h[j];
        h[j] = u & 255;
        u >>= 8;
    }
    u += h[16];
    h[16] = u;
}

static const unsigned int minusp_poly1305[17] = {
    5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 252};

static void freeze_poly1305(unsigned int h[17])
{
    unsigned int horig[17];
    unsigned int j;
    unsigned int negative;
    for (j = 0; j < 17; ++j)
        horig[j] = h[j];
    add_poly1305(h, minusp_poly1305);
    negative = -(h[16] >> 7);
    for (j = 0; j < 17; ++j)
        h[j] ^= negative & (horig[j] ^ h[j]);
}

static void mulmod_poly1305(unsigned int h[17], const unsigned int r[17])
{
    unsigned int hr[17];
    unsigned int i;
    unsigned int j;
    unsigned int u;

    for (i = 0; i < 17; ++i)
    {
        u = 0;
        for (j = 0; j <= i; ++j)
            u += h[j] * r[i - j];
        for (j = i + 1; j < 17; ++j)
            u += 320 * h[j] * r[i + 17 - j];
        hr[i] = u;
    }
    for (i = 0; i < 17; ++i)
        h[i] = hr[i];
    squeeze_poly1305(h);
}

int crypto_verify_16(const unsigned char *x, const unsigned char *y)
{
    unsigned int differentbits = 0;
#define F(i) differentbits |= x[i] ^ y[i];
    F(0)
    F(1)
    F(2)
    F(3)
    F(4)
    F(5)
    F(6)
    F(7)
    F(8)
    F(9)
    F(10)
    F(11)
    F(12)
    F(13)
    F(14)
    F(15)
    return (1 & ((differentbits - 1) >> 8)) - 1;
}

int crypto_onetimeauth(unsigned char *out, const unsigned char *in, unsigned long long inlen, const unsigned char *k)
{
    unsigned int j;
    unsigned int r[17];
    unsigned int h[17];
    unsigned int c[17];

    r[0] = k[0];
    r[1] = k[1];
    r[2] = k[2];
    r[3] = k[3] & 15;
    r[4] = k[4] & 252;
    r[5] = k[5];
    r[6] = k[6];
    r[7] = k[7] & 15;
    r[8] = k[8] & 252;
    r[9] = k[9];
    r[10] = k[10];
    r[11] = k[11] & 15;
    r[12] = k[12] & 252;
    r[13] = k[13];
    r[14] = k[14];
    r[15] = k[15] & 15;
    r[16] = 0;

    for (j = 0; j < 17; ++j)
        h[j] = 0;

    while (inlen > 0)
    {
        for (j = 0; j < 17; ++j)
            c[j] = 0;
        for (j = 0; (j < 16) && (j < inlen); ++j)
            c[j] = in[j];
        c[j] = 1;
        in += j;
        inlen -= j;
        add_poly1305(h, c);
        mulmod_poly1305(h, r);
    }

    freeze_poly1305(h);

    for (j = 0; j < 16; ++j)
        c[j] = k[j + 16];
    c[16] = 0;
    add_poly1305(h, c);
    for (j = 0; j < 16; ++j)
        out[j] = h[j];
    return 0;
}

int crypto_onetimeauth_verify(const unsigned char *h, const unsigned char *in, unsigned long long inlen, const unsigned char *k)
{
    unsigned char correct[16];
    crypto_onetimeauth(correct, in, inlen, k);
    return crypto_verify_16(h, correct);
}

int crypto_secretbox(
    unsigned char *c,
    const unsigned char *m, unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *k)
{
    int i;
    if (mlen < 32)
        return -1;
    crypto_stream_xsalsa20_xor(c, m, mlen, n, k);
    crypto_onetimeauth(c + 16, c + 32, mlen - 32, c);
    for (i = 0; i < 16; ++i)
        c[i] = 0;
    return 0;
}

int crypto_secretbox_open(
    unsigned char *m,
    const unsigned char *c, unsigned long long clen,
    const unsigned char *n,
    const unsigned char *k)
{
    int i;
    unsigned char subkey[32];
    if (clen < 32)
        return -1;
    crypto_stream_xsalsa20(subkey, 32, n, k);
    if (crypto_onetimeauth_verify(c + 16, c + 32, clen - 32, subkey) != 0)
        return -1;
    crypto_stream_xsalsa20_xor(m, c, clen, n, k);
    for (i = 0; i < 32; ++i)
        m[i] = 0;
    return 0;
}

int crypto_box_keypair(
    unsigned char *pk,
    unsigned char *sk)
{
    randombytes(sk, 32);
    return crypto_scalarmult_base(pk, sk);
}

int crypto_box_beforenm(unsigned char *k, const unsigned char *pk, const unsigned char *sk)
{
    unsigned char s[32];
    crypto_scalarmult(s, sk, pk);
    return crypto_core_hsalsa20(k, n, s, sigma);
}

int crypto_box(
    unsigned char *c,
    const unsigned char *m, unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *pk,
    const unsigned char *sk)
{
    unsigned char k[crypto_box_BEFORENMBYTES];
    crypto_box_beforenm(k, pk, sk);
    return crypto_box_afternm(c, m, mlen, n, k);
}

int crypto_box_open_afternm(
    unsigned char *m,
    const unsigned char *c, unsigned long long clen,
    const unsigned char *n,
    const unsigned char *k)
{
    return crypto_secretbox_open(m, c, clen, n, k);
}

int crypto_box_open(
    unsigned char *m,
    const unsigned char *c, unsigned long long clen,
    const unsigned char *n,
    const unsigned char *pk,
    const unsigned char *sk)
{
    unsigned char k[crypto_box_BEFORENMBYTES];
    crypto_box_beforenm(k, pk, sk);
    return crypto_box_open_afternm(m, c, clen, n, k);
}

int crypto_box_afternm(
    unsigned char *c,
    const unsigned char *m, unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *k)
{
    return crypto_secretbox(c, m, mlen, n, k);
}
