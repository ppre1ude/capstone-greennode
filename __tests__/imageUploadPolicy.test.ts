import {
  MAX_UPLOAD_IMAGE_BYTES,
  validateImageForUpload,
} from '@/utils/imageUploadPolicy';

describe('validateImageForUpload', () => {
  it('allows a normal selected jpeg image', () => {
    expect(
      validateImageForUpload({
        uri: 'file:///photo.jpg',
        type: 'image/jpeg',
        fileSize: 1024 * 1024,
      }),
    ).toEqual({ok: true});
  });

  it('blocks selected images over the MVP upload size limit', () => {
    expect(
      validateImageForUpload({
        uri: 'file:///large.jpg',
        type: 'image/jpeg',
        fileSize: MAX_UPLOAD_IMAGE_BYTES + 1,
      }),
    ).toEqual({
      ok: false,
      reason:
        '이미지 용량이 8MB를 초과합니다. 더 작은 사진을 선택하거나 촬영 후 다시 시도해주세요.',
    });
  });

  it('blocks non-image assets before upload', () => {
    expect(
      validateImageForUpload({
        uri: 'file:///note.txt',
        type: 'text/plain',
        fileSize: 100,
      }),
    ).toEqual({
      ok: false,
      reason: '지원하지 않는 이미지 형식입니다. JPG 또는 PNG 사진을 선택해주세요.',
    });
  });
});
