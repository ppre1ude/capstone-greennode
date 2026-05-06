export type LocationFields = {
  latitude?: number | null;
  longitude?: number | null;
};

export type RegisteredLocation = {
  latitude: number;
  longitude: number;
};

export const LOCATION_REQUIRED_TITLE = '동네 위치를 설정해주세요';
export const LOCATION_REQUIRED_MESSAGE =
  '동네 위치를 설정하면 주변 나눔 식재료와 공유 냉장고를 확인할 수 있습니다.';
export const LOCATION_REQUIRED_CTA = '위치 설정하기';

export const getRegisteredLocation = (
  location?: LocationFields | null,
): RegisteredLocation | null => {
  if (location?.latitude == null || location.longitude == null) {
    return null;
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
};

export const hasRegisteredLocation = (
  location?: LocationFields | null,
): boolean => getRegisteredLocation(location) !== null;
