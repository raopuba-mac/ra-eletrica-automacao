export function formatServicePrice(price?: number): string {
  if (price === undefined || price <= 0) return '';
  return `A partir de R$ ${price.toFixed(2).replace('.', ',')}`;
}
