#pragma once
#include "emscripten.h"

struct Bytes32 {
  uint8_t data[32];
};

struct Bytes64 {
  uint8_t data[64];
};

struct Bytes640 {
  uint8_t data[640];
};

struct Bytes320 {
  uint8_t data[640];
};


EM_JS(void, compare_bytes_64, (const Bytes64 a, const Bytes64 b), {
  const bufA = new Uint8Array(64);
  for (let i = 0; i < bufA.length; i++) {
    bufA[i] = getValue(a + i, 'i8');
  }

  const bufB = new Uint8Array(64);
  for (let i = 0; i < bufB.length; i++) {
    bufB[i] = getValue(b + i, 'i8');
  }

  console.log(`Bytes A: ${Buffer.from(bufA).toString("hex")}`);
  // console.log(`Bytes B: ${Buffer.from(bufB).toString("hex")}`);
});

EM_JS(void, compare_bytes_32, (const Bytes32 a, const Bytes32 b), {
  const bufA = new Uint8Array(32);
  for (let i = 0; i < bufA.length; i++) {
    bufA[i] = getValue(a + i, 'i8');
  }

  const bufB = new Uint8Array(32);
  for (let i = 0; i < bufB.length; i++) {
    bufB[i] = getValue(b + i, 'i8');
  }

  console.log(`Bytes A: ${Buffer.from(bufA).toString("hex")}`);
  // console.log(`Bytes B: ${Buffer.from(bufB).toString("hex")}`);
});

EM_JS(void, compare_bytes, (const Bytes640 a, const Bytes640 b), {
  const bufA = new Uint8Array(640);
  for (let i = 0; i < bufA.length; i++) {
    bufA[i] = getValue(a + i, 'i8');
  }

  const bufB = new Uint8Array(640);
  for (let i = 0; i < bufB.length; i++) {
    bufB[i] = getValue(b + i, 'i8');
  }

  console.log(`Bytes A: ${Buffer.from(bufA).toString("hex")}`);
  // console.log(`Bytes B: ${Buffer.from(bufB).toString("hex")}`);
});

EM_JS(void, compare_bytes_2, (const Bytes320 a, const Bytes320 b), {
  const bufA = new Uint8Array(320);
  for (let i = 0; i < bufA.length; i++) {
    bufA[i] = getValue(a + i, 'i8');
  }

  const bufB = new Uint8Array(320);
  for (let i = 0; i < bufB.length; i++) {
    bufB[i] = getValue(b + i, 'i8');
  }

  console.log(`Bytes A: ${Buffer.from(bufA).toString("hex")}`);
//   console.log(`Bytes B: ${Buffer.from(bufB).toBase58()}`);
});

// EM_ASM_({
//   console.log('I received: ' + $0);
// }, pub);