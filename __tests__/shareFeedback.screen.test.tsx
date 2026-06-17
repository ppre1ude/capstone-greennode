import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ShareFeedbackScreen from '@/screens/trust/ShareFeedbackScreen';
import { createShareReview } from '@/api/trust';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';

jest.mock('@/api/trust', () => ({
  createShareReview: jest.fn(),
}));

const mockedCreateShareReview = createShareReview as jest.MockedFunction<
  typeof createShareReview
>;

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
    mockedCreateShareReview.mockResolvedValue({
      success: true,
      message: '수령 경험 평가가 저장되었습니다.',
      data: {
        id: 1,
        requestId: 55,
        postId: 41,
        providerId: 4,
        requesterId: 3,
        positiveTagIds: ['good_condition'],
        issueTagIds: [],
        createdAt: '2026-06-04T12:00:00.000Z',
        updatedAt: '2026-06-04T12:00:00.000Z',
      },
    });
    useTrustFeedbackStore.getState().resetTrustFeedback();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('records selected positive tags as a share review', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: routeParams } as never}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '상태가 좋아요').props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '평가 제출').props.onPress();
    });

    expect(mockedCreateShareReview).toHaveBeenCalledWith(55, {
      positiveTagIds: ['good_condition'],
      issueTagIds: [],
    });
    expect(useTrustFeedbackStore.getState().reviews[55]).toMatchObject({
      requestId: 55,
      postId: 41,
      providerId: 4,
      positiveTagIds: ['good_condition'],
      issueTagIds: [],
    });
    expect(alertSpy).toHaveBeenCalledWith(
      '평가 완료',
      '수령 경험 평가가 저장되었습니다.',
    );
    expect(navigation.goBack).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('toggles positive tags and enables submit only while one is selected', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: routeParams } as never}
        />,
      );
    });

    expect(
      findTouchableByText(renderer!, '평가 제출').props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      findTouchableByText(renderer!, '상태가 좋아요').props.accessibilityState,
    ).toMatchObject({ selected: false });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '상태가 좋아요').props.onPress();
    });

    expect(
      findTouchableByText(renderer!, '상태가 좋아요').props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      findTouchableByText(renderer!, '평가 제출').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다시 받고 싶어요').props.onPress();
    });

    expect(
      findTouchableByText(renderer!, '다시 받고 싶어요').props
        .accessibilityState,
    ).toMatchObject({ selected: true });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '상태가 좋아요').props.onPress();
    });

    expect(
      findTouchableByText(renderer!, '상태가 좋아요').props.accessibilityState,
    ).toMatchObject({ selected: false });
    expect(
      findTouchableByText(renderer!, '다시 받고 싶어요').props
        .accessibilityState,
    ).toMatchObject({ selected: true });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다시 받고 싶어요').props.onPress();
    });

    expect(
      findTouchableByText(renderer!, '평가 제출').props.accessibilityState,
    ).toMatchObject({ disabled: true });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('shows only positive feedback tags without report or issue sections', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: routeParams } as never}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({ children: '수령 경험 평가' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '좋았던 점' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '아쉬웠던 점' }),
    ).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: '신고' })).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '신고 사유 선택' }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAll(
        node =>
          node.type === TouchableOpacity &&
          node.props.accessibilityRole === 'radio',
      ),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
