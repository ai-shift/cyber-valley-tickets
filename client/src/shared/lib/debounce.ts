// biome-ignore lint/suspicious/noExplicitAny: Mamu bioma ebal i tsa tozhe
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay = 300,
) {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
