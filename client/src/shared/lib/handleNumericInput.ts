export const handleNumericInput = (input: string): number => {
  const cleaned = input.replace(/[^0-9]/g, "");

  const normalized = cleaned.replace(/^0+(\d)/, "$1");

  if (normalized !== "") {
    return Number(normalized);
  }
  return 0;
};
