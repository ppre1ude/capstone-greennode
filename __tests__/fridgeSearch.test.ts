import {filterFridges} from '@/utils/fridgeSearch';
import type {Fridge} from '@/types';

const fridges: Fridge[] = [
  {
    id: 1,
    name: '광주역 공유냉장고',
    address: '광주광역시 북구 광주역 앞',
    latitude: 35.164,
    longitude: 126.91,
    isActive: true,
  },
  {
    id: 2,
    name: '전남대학교 공유냉장고',
    address: '광주광역시 북구 용봉로',
    latitude: 35.176,
    longitude: 126.908,
    isActive: true,
  },
];

describe('filterFridges', () => {
  it('returns all fridges when the query is blank', () => {
    expect(filterFridges(fridges, '   ')).toEqual(fridges);
  });

  it('matches fridge name and address case-insensitively', () => {
    expect(filterFridges(fridges, '전남대')).toEqual([fridges[1]]);
    expect(filterFridges(fridges, '용봉')).toEqual([fridges[1]]);
  });

  it('returns an empty list when there is no local result', () => {
    expect(filterFridges(fridges, '없는냉장고테스트')).toEqual([]);
  });
});
