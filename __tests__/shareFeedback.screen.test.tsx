import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ShareFeedbackScreen from '@/screens/trust/ShareFeedbackScreen';
import { createShareReport, createShareReview } from '@/api/trust';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';

jest.mock('@/api/trust', () => ({
  createShareReview: jest.fn(),
  createShareReport: jest.fn(),
}));

const mockedCreateShareReview = createShareReview as jest.MockedFunction<
  typeof createShareReview
>;
const mockedCreateShareReport = createShareReport as jest.MockedFunction<
  typeof createShareReport
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
        issueTagIds: ['different_from_photo'],
        createdAt: '2026-06-04T12:00:00.000Z',
        updatedAt: '2026-06-04T12:00:00.000Z',
      },
    });
    mockedCreateShareReport.mockResolvedValue({
      success: true,
      message: '신고가 접수되었습니다.',
      data: {
        id: 2,
        requestId: 55,
        postId: 41,
        providerId: 4,
        requesterId: 3,
        reasonId: 'inappropriate_listing',
        status: 'open',
        resolution: 'pending',
        action: 'none',
        createdAt: '2026-06-04T12:05:00.000Z',
        updatedAt: '2026-06-04T12:05:00.000Z',
      },
    });
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

    expect(mockedCreateShareReview).toHaveBeenCalledWith(55, {
      positiveTagIds: ['good_condition'],
      issueTagIds: ['different_from_photo'],
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
      '수령 경험 평가가 저장되었습니다.',
    );
    expect(navigation.goBack).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('records one report reason as an operator review case', async () => {
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
      findTouchableByText(renderer!, '부적절한 등록이에요').props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '신고 제출').props.onPress();
    });

    expect(mockedCreateShareReport).toHaveBeenCalledWith(55, {
      reasonId: 'inappropriate_listing',
    });
    expect(useTrustFeedbackStore.getState().reports[55]).toMatchObject({
      requestId: 55,
      postId: 41,
      providerId: 4,
      reasonId: 'inappropriate_listing',
      status: 'open',
      resolution: 'pending',
      action: 'none',
    });
    expect(alertSpy).toHaveBeenCalledWith(
      '신고 접수',
      '신고가 접수되었습니다.',
    );
    expect(navigation.goBack).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders report reasons as radio options instead of feedback chips', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareFeedbackScreen
          navigation={navigation as never}
          route={{ params: { ...routeParams, initialMode: 'report' } } as never}
        />,
      );
    });

    const reasonRows = renderer!.root.findAll(
      node =>
        node.type === TouchableOpacity &&
        node.props.accessibilityRole === 'radio',
    );

    expect(reasonRows).toHaveLength(5);
    expect(reasonRows[0].props.accessibilityState).toMatchObject({
      checked: false,
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '등록 사진과 실제 식재료가 달라요').props.onPress();
    });

    const selectedReasonRows = renderer!.root.findAll(
      node =>
        node.type === TouchableOpacity &&
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityState?.checked,
    );

    expect(selectedReasonRows).toHaveLength(1);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
