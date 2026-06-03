import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ShareFeedbackScreen from '@/screens/trust/ShareFeedbackScreen';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';

const findTouchableByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  const touchable = renderer.root.findAll(
    node =>
      node.type === TouchableOpacity &&
      node.findAllByProps({ children: text }).length > 0,
  )[0];

  if (!touchable) {
    throw new Error(`Touchable with text "${text}" not found`);
  }

  return touchable;
};

const routeParams = {
  requestId: 55,
  postId: 41,
  providerId: 4,
  fruitName: '사과',
  fridgeName: '중앙 공유 냉장고',
} as const;

describe('ShareFeedbackScreen', () => {
  const navigation = {
    goBack: jest.fn(),
  };
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    useTrustFeedbackStore.getState().resetTrustFeedback();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('records selected positive and issue tags as a share review', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: { ...routeParams, initialMode: 'review' } } as never}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '상태가 좋아요').props.onPress();
      findTouchableByText(renderer!, '사진과 달라요').props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '평가 제출').props.onPress();
    });

    expect(useTrustFeedbackStore.getState().reviews[55]).toMatchObject({
      requestId: 55,
      postId: 41,
      providerId: 4,
      positiveTagIds: ['good_condition'],
      issueTagIds: ['different_from_photo'],
    });
    expect(alertSpy).toHaveBeenCalledWith(
      '평가 완료',
      '수령 경험이 공급자 신뢰에 반영되었습니다.',
    );
    expect(navigation.goBack).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('records selected report reasons separately from review tags', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: { ...routeParams, initialMode: 'report' } } as never}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '이미 없거나 찾을 수 없었어요').props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '신고 제출').props.onPress();
    });

    expect(useTrustFeedbackStore.getState().reports[55]).toMatchObject({
      requestId: 55,
      postId: 41,
      providerId: 4,
      reasonIds: ['missing_or_not_found'],
    });
    expect(alertSpy).toHaveBeenCalledWith(
      '신고 접수',
      '운영자 검토가 필요한 항목으로 기록했습니다.',
    );
    expect(navigation.goBack).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
