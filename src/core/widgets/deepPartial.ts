/**
 * Shape of an object while it is still being streamed: every field may be missing,
 * and array items may be missing or partially filled.
 */
export type DeepPartial<T> =
  T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepPartial<Item> | undefined>
    : T extends object
      ? { [Key in keyof T]?: DeepPartial<T[Key]> }
      : T;
