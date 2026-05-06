import {
  getRegisteredLocation,
  hasRegisteredLocation,
} from '@/utils/locationGuard';

describe('location guard', () => {
  it('accepts registered coordinates including zero values', () => {
    expect(getRegisteredLocation({latitude: 0, longitude: 0})).toEqual({
      latitude: 0,
      longitude: 0,
    });
    expect(hasRegisteredLocation({latitude: 0, longitude: 0})).toBe(true);
  });

  it.each([
    null,
    undefined,
    {latitude: null, longitude: 126.9136},
    {latitude: 35.1595, longitude: null},
    {latitude: undefined, longitude: 126.9136},
    {latitude: 35.1595, longitude: undefined},
  ])('rejects missing coordinates %#', location => {
    expect(getRegisteredLocation(location)).toBeNull();
    expect(hasRegisteredLocation(location)).toBe(false);
  });
});
