import { BigNumber } from "ethers";

export function convertBigNumberToString<T>(
  obj: T
): T extends BigNumber
  ? string
  : T extends (infer U)[]
  ? U extends BigNumber
    ? string[]
    : U[]
  : T extends object
  ? { [K in keyof T]: T[K] extends BigNumber ? string : T[K] }
  : T {
  if (BigNumber.isBigNumber(obj)) {
    return obj.toString() as any;
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigNumberToString) as any;
  } else if (typeof obj === "object" && obj !== null) {
    const result: { [key: string]: any } = {};
    for (const key in obj) {
      result[key] = convertBigNumberToString(obj[key]);
    }
    return result as any;
  }
  return obj as any;
}
