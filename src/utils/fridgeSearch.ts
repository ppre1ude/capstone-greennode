import type {Fridge} from '@/types';

const normalizeSearchText = (value: string): string =>
  value.trim().toLocaleLowerCase();

export const filterFridges = (fridges: Fridge[], query: string): Fridge[] => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return fridges;
  }

  return fridges.filter(fridge => {
    const target = `${fridge.name} ${fridge.address}`.toLocaleLowerCase();
    return target.includes(normalizedQuery);
  });
};
