import { Transform } from 'class-transformer';

export function ToLowerCase() {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}
