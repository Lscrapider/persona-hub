const CJK_CHARACTER = /[\u3400-\u9fff]/u;

export function containsCjk(value: string) {
  return CJK_CHARACTER.test(value);
}
