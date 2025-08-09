export interface IDisposable {
  dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

export function leftPad(
  value: string | number,
  size: number,
  char: string = " "
) {
  const chars = char.repeat(size);

  const paddedNumber = `${chars}${value}`.substr(-chars.length);

  return paddedNumber;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getPrefixChar(index: number): string {
  if (index < 9) return `${index + 1}`;
  if (index < 35) return `${String.fromCharCode(97 + (index - 9))}`;
  return "";
}

export function getPrefix(index: number): string {
  const char = getPrefixChar(index);
  return char ? `${char}] ` : "";
}
