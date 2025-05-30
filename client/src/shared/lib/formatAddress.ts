export const formatAddress = (address: `0x${string}`) =>
  `${address.slice(0, 7)}...${address.slice(-5)}`;
