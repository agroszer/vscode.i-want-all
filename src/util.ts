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

export function getPrefix(index: number): string {
  const sep = "] ";
  if (index < 9) return `${index + 1}${sep}`;
  if (index < 35) return `${String.fromCharCode(97 + (index - 9))}${sep}`;
  return "";
}
