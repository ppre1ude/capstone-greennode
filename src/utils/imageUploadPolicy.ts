export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadImageInput = {
  uri?: string | null;
  type?: string | null;
  fileSize?: number | null;
};

type UploadImageValidationResult =
  | {ok: true}
  | {
      ok: false;
      reason: string;
    };

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export const validateImageForUpload = (
  image: UploadImageInput,
): UploadImageValidationResult => {
  if (!image.uri) {
    return {
      ok: false,
      reason: '이미지 파일을 확인할 수 없습니다. 다시 선택해주세요.',
    };
  }

  if (image.type && !SUPPORTED_IMAGE_TYPES.has(image.type.toLowerCase())) {
    return {
      ok: false,
      reason: '지원하지 않는 이미지 형식입니다. JPG 또는 PNG 사진을 선택해주세요.',
    };
  }

  if (
    typeof image.fileSize === 'number' &&
    image.fileSize > MAX_UPLOAD_IMAGE_BYTES
  ) {
    return {
      ok: false,
      reason:
        '이미지 용량이 8MB를 초과합니다. 더 작은 사진을 선택하거나 촬영 후 다시 시도해주세요.',
    };
  }

  return {ok: true};
};
