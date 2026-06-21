/**
 * Xeioa Obfuscator — 3-Layer + Junk Code
 *
 * Layer 1 (deepest):  XOR cipher with PRNG-seeded random key
 * Layer 2 (middle):   RC4 stream cipher with separate random key
 * Layer 3 (outer):    XOR cipher with another random key
 * Bonus:              Junk code injection, obfuscated variable names (l/I/1/O/0),
 *                     table.concat for O(n) string building
 *
 * Decryption chain at runtime (Lua):
 *   Outer XOR → L2 Lua code → loadstring → RC4 → L1 Lua code → loadstring → XOR → source → loadstring → run
 */

/** LCG variable name generator using visually-confusable chars */
function varName(seed: number, len: number): string {
  const pool = "lI1O0lIlI1O0l1I";
  let s = seed;
  let out = "";
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    out += pool[(s >>> 0) % pool.length];
  }
  return /^[01]/.test(out) ? "l" + out : out;
}

/** RC4 cipher — used server-side for Layer 2 encryption */
function rc4Cipher(data: number[], key: number[]): number[] {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    [s[i], s[j]] = [s[j], s[i]];
  }
  const out: number[] = [];
  let ci = 0, cj = 0;
  for (const b of data) {
    ci = (ci + 1) % 256;
    cj = (cj + s[ci]) % 256;
    [s[ci], s[cj]] = [s[cj], s[ci]];
    out.push(b ^ s[(s[ci] + s[cj]) % 256]);
  }
  return out;
}

/** Chunk an array into CSV lines of `size` numbers each */
function chunkArr(arr: number[], size = 100): string {
  const lines: string[] = [];
  for (let i = 0; i < arr.length; i += size) {
    lines.push(arr.slice(i, i + size).join(","));
  }
  return lines.join(",\n");
}

/** Generate `count` lines of dead Lua code (never executed, hard to analyse) */
function junkLines(seed: number, count: number, nv: () => string): string {
  const lines: string[] = [];
  let s = seed;
  for (let k = 0; k < count; k++) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const r = (s >>> 0) % 5;
    const va = nv();
    const n1 = ((s >>> 0) % 997) + 3;
    const n2 = ((s >>> 16) % 251) + 2;
    switch (r) {
      case 0: lines.push(`local ${va}=(${n1}*${n2}+1)%${n1+1}`); break;
      case 1: lines.push(`if false then local ${va}=${n1} end`); break;
      case 2: lines.push(`for ${va}=1,0 do end`); break;
      case 3: lines.push(`local ${va}=math.max(${n1},${n2})~=${n1+n2} and ${n1} or ${n2}`); break;
      case 4: lines.push(`local ${va}=string.byte(string.char(${n1 % 128}))`); break;
    }
  }
  return lines.join("\n");
}

function xorLayer(bytes: number[], baseSeed: number): string {
  const keyLen = 48 + Math.floor(Math.random() * 48);
  const key = Array.from({ length: keyLen }, () => Math.floor(Math.random() * 254) + 1);
  const enc = bytes.map((b, i) => b ^ key[i % keyLen]);

  let s = baseSeed;
  const nv = (extra = 0): string => {
    s = (s + 99991) | 0;
    return varName(s, 6 + extra);
  };

  const vE   = nv();
  const vK   = nv();
  const vR   = nv();
  const vKL  = nv();
  const vI   = nv();
  const vXor = nv(4);
  const vA   = nv();
  const vB   = nv();
  const vAC  = nv();
  const vM   = nv();

  const junk1 = junkLines(s + 1, 8, () => { s += 37; return varName(s, 5); });
  const junk2 = junkLines(s + 7, 6, () => { s += 53; return varName(s, 5); });

  return [
    `local ${vE}={`,
    chunkArr(enc),
    `}`,
    `local ${vK}={${key.join(",")}}`,
    `local ${vKL}=#${vK}`,
    junk1,
    `local function ${vXor}(${vA},${vB})`,
    `local ${vAC},${vM}=0,128`,
    `while ${vM}>0 do`,
    `if(${vA}>=${vM} or ${vB}>=${vM})and not(${vA}>=${vM} and ${vB}>=${vM})then ${vAC}=${vAC}+${vM} end`,
    `if ${vA}>=${vM} then ${vA}=${vA}-${vM} end`,
    `if ${vB}>=${vM} then ${vB}=${vB}-${vM} end`,
    `${vM}=math.floor(${vM}/2)`,
    `end`,
    `return ${vAC}`,
    `end`,
    junk2,
    `local ${vR}={}`,
    `for ${vI}=1,#${vE} do`,
    `${vR}[${vI}]=string.char(${vXor}(${vE}[${vI}],${vK}[(${vI}-1)%${vKL}+1]))`,
    `end`,
    `loadstring(table.concat(${vR}))()`,
  ].join("\n");
}

function rc4Layer(bytes: number[], baseSeed: number): string {
  const keyLen = 32 + Math.floor(Math.random() * 32);
  const key = Array.from({ length: keyLen }, () => Math.floor(Math.random() * 255) + 1);
  const enc = rc4Cipher(bytes, key);

  let s = baseSeed;
  const nv = (extra = 0): string => {
    s = (s + 77777) | 0;
    return varName(s, 6 + extra);
  };

  const vE   = nv();
  const vK   = nv();
  const vS   = nv();
  const vI   = nv();
  const vJ   = nv();
  const vX   = nv();
  const vY   = nv();
  const vT   = nv();
  const vR   = nv();
  const vXor = nv(4);
  const vA   = nv();
  const vB   = nv();
  const vAC  = nv();
  const vM   = nv();
  const vKL  = nv();
  const vRC4 = nv(5);

  const junk1 = junkLines(s + 3, 10, () => { s += 41; return varName(s, 5); });
  const junk2 = junkLines(s + 9, 8,  () => { s += 29; return varName(s, 5); });

  return [
    `local ${vE}={`,
    chunkArr(enc),
    `}`,
    `local ${vK}={${key.join(",")}}`,
    `local ${vKL}=#${vK}`,
    junk1,
    `local function ${vXor}(${vA},${vB})`,
    `local ${vAC},${vM}=0,128`,
    `while ${vM}>0 do`,
    `if(${vA}>=${vM} or ${vB}>=${vM})and not(${vA}>=${vM} and ${vB}>=${vM})then ${vAC}=${vAC}+${vM} end`,
    `if ${vA}>=${vM} then ${vA}=${vA}-${vM} end`,
    `if ${vB}>=${vM} then ${vB}=${vB}-${vM} end`,
    `${vM}=math.floor(${vM}/2)`,
    `end`,
    `return ${vAC}`,
    `end`,
    junk2,
    `local function ${vRC4}(d,k)`,
    `local ${vS}={}`,
    `for ${vI}=0,255 do ${vS}[${vI}+1]=${vI} end`,
    `local ${vJ},kl=0,#k`,
    `for ${vI}=0,255 do`,
    `${vJ}=(${vJ}+${vS}[${vI}+1]+k[${vI}%kl+1])%256`,
    `${vT}=${vS}[${vI}+1];${vS}[${vI}+1]=${vS}[${vJ}+1];${vS}[${vJ}+1]=${vT}`,
    `end`,
    `local ${vR}={}`,
    `local ${vX},${vY}=0,0`,
    `for ${vI}=1,#d do`,
    `${vX}=(${vX}+1)%256`,
    `${vY}=(${vY}+${vS}[${vX}+1])%256`,
    `${vT}=${vS}[${vX}+1];${vS}[${vX}+1]=${vS}[${vY}+1];${vS}[${vY}+1]=${vT}`,
    `${vR}[${vI}]=string.char(${vXor}(d[${vI}],${vS}[(${vS}[${vX}+1]+${vS}[${vY}+1])%256+1]))`,
    `end`,
    `return table.concat(${vR})`,
    `end`,
    `loadstring(${vRC4}(${vE},${vK}))()`,
  ].join("\n");
}

export function obfuscateLua(source: string): string {
  const src   = [...Buffer.from(source, "utf8")];
  const seed1 = (Date.now() ^ 0xdeadbeef) | 0;

  const l1Lua   = xorLayer(src, seed1);

  const l1Bytes = [...Buffer.from(l1Lua, "utf8")];
  const seed2   = (Math.imul(seed1, 6364136) + 1442695040) | 0;
  const l2Lua   = rc4Layer(l1Bytes, seed2);

  const l2Bytes = [...Buffer.from(l2Lua, "utf8")];
  const seed3   = (Math.imul(seed2, 6364136) + 1442695040) | 0;
  const l3Lua   = xorLayer(l2Bytes, seed3);

  return l3Lua;
}
