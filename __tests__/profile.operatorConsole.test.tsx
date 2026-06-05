import React from 'react';
import { Alert, TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/auth';
import { getUserTrustSummary } from '@/api/trust';

const mockParentNavigate = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
    getParent: jest.fn(() => ({ navigate: mockParentNavigate })),
  })),
}));

jest.mock('@/api/auth', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('@/api/trust', () => ({
  getUserTrustSummary: jest.fn(),
}));

const mockedUpdateProfile = updateProfile as jest.MockedFunction<
  typeof updateProfile
>;
const mockedGetUserTrustSummary = getUserTrustSummary as jest.MockedFunction<
  typeof getUserTrustSummary
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

const expectOperatorConsoleVisible = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  visible: boolean,
) => {
  const matches = renderer.root.findAllByProps({
    children: '냉장고 운영자 콘솔',
  });
  expect(matches.length > 0).toBe(visible);
};

const expectTextVisible = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
  visible: boolean,
) => {
  const matches = renderer.root.findAllByProps({ children: text });
  expect(matches.length > 0).toBe(visible);
};

describe('ProfileScreen operator console entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        email: 'operator-test@example.com',
        nickname: '테스터',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9136,
        fcmToken: null,
        isActive: true,
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-05-15T00:00:00Z',
      },
      isLoggedIn: true,
      hasLocation: true,
    });
    mockedUpdateProfile.mockResolvedValue({
      success: true,
      message: '사용자 조회 성공',
      data: {
        ...useAuthStore.getState().user!,
        nickname: '테스터 수정',
        profileImageUrl: 'https://example.com/profile.jpg',
        updatedAt: '2026-05-27T00:00:00Z',
      },
    });
    mockedGetUserTrustSummary.mockResolvedValue({
      success: true,
      message: '공급자 신뢰 요약 조회 성공',
      data: {
        userId: 1,
        completedShares: 12,
        positiveReviewCount: 9,
        matchedPhotoCount: 8,
        easyToFindCount: 7,
        badges: [
          'store_qr_verified',
          'completed_pickup',
          'positive_reviews',
        ],
        computedAt: '2026-06-04T12:10:00.000Z',
      },
    });
  });

  it('opens the temporary fridge operator console from profile', async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        operatorRole: 'operator',
        operatorFridgeIds: [1],
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '냉장고 운영자 콘솔').props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('FridgeOperatorConsole');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it.each([
    ['isOperator true', { isOperator: true }],
    ['operatorRole admin', { operatorRole: 'admin' }],
    ['operatorRole fridge_operator', { operatorRole: 'fridge_operator' }],
    ['operatorFridgeIds present', { operatorFridgeIds: [1] }],
    ['roles include fridge_operator', { roles: ['member', 'fridge_operator'] }],
  ])('shows the operator entry for %s metadata', async (_label, metadata) => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        ...(metadata as object),
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, true);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it.each([
    ['empty operator fridge ids', { operatorFridgeIds: [] }],
    ['regular roles only', { roles: ['member'] }],
    ['unknown operator role', { operatorRole: 'viewer' }],
  ])('hides the operator entry for %s metadata', async (_label, metadata) => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        ...(metadata as object),
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('hides the operator console entry for regular users', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('exposes real lifecycle actions from the primary profile surface', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectTextVisible(renderer!, '나눔 관리', true);
    expectTextVisible(renderer!, '내 나눔 관리', true);
    expectTextVisible(renderer!, '받은 나눔 관리', true);
    expectTextVisible(renderer!, '알림함', true);
    expectTextVisible(renderer!, '냉장고 QR 인증', false);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '내 나눔 관리').props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('MyShares', {
      initialTab: 'posted',
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '받은 나눔 관리').props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('MyShares', {
      initialTab: 'received',
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '알림함').props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Chat');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('shows the provider trust surface instead of the old freshness temperature placeholder', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    expectTextVisible(renderer!, '나눔 신뢰 지표', true);
    expect(mockedGetUserTrustSummary).toHaveBeenCalledWith(1);
    expectTextVisible(renderer!, 'QR 인증', true);
    expectTextVisible(renderer!, 'QR 기반', false);
    expectTextVisible(renderer!, 'QR 보관 인증', true);
    expectTextVisible(renderer!, '수령 완료 12회', true);
    expectTextVisible(renderer!, '긍정 평가 9회', true);
    expectTextVisible(renderer!, '수령 완료', true);
    expectTextVisible(renderer!, '12건', true);
    expectTextVisible(renderer!, '긍정 평가', true);
    expectTextVisible(renderer!, '9건', true);
    expectTextVisible(renderer!, '최근 신고 검토 없음', false);
    expectTextVisible(renderer!, '신선도 온도', false);
    expectTextVisible(renderer!, '보유 포인트', false);
    expectTextVisible(renderer!, '탄소 절감량', false);
    expectTextVisible(renderer!, '준비 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('uses zero-value trust counters instead of loading placeholders when trust summary is unavailable', async () => {
    mockedGetUserTrustSummary.mockRejectedValueOnce(
      new Error('trust summary unavailable'),
    );
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    expectTextVisible(renderer!, '나눔 신뢰 지표', true);
    expectTextVisible(renderer!, '수령 완료 0회', true);
    expectTextVisible(renderer!, '긍정 평가 0회', true);
    expect(
      renderer!.root.findAllByProps({ children: '0건' }).length,
    ).toBeGreaterThanOrEqual(2);
    expectTextVisible(renderer!, '확인 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('uses zero-value trust counters while trust summary is still loading', async () => {
    mockedGetUserTrustSummary.mockImplementationOnce(
      () => new Promise(() => undefined),
    );
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectTextVisible(renderer!, '나눔 신뢰 지표', true);
    expectTextVisible(renderer!, '수령 완료 0회', true);
    expectTextVisible(renderer!, '긍정 평가 0회', true);
    expect(
      renderer!.root.findAllByProps({ children: '0건' }).length,
    ).toBeGreaterThanOrEqual(2);
    expectTextVisible(renderer!, '확인 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('clears the previous user trust counters while the next user summary is loading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    expectTextVisible(renderer!, '12건', true);

    mockedGetUserTrustSummary.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    await ReactTestRenderer.act(async () => {
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          id: 2,
          email: 'next-user@example.com',
          nickname: '다음유저',
        },
      });
      await Promise.resolve();
    });

    expect(mockedGetUserTrustSummary).toHaveBeenLastCalledWith(2);
    expectTextVisible(renderer!, '12건', false);
    expectTextVisible(renderer!, '9건', false);
    expectTextVisible(renderer!, '수령 완료 0회', true);
    expectTextVisible(renderer!, '긍정 평가 0회', true);
    expect(
      renderer!.root.findAllByProps({ children: '0건' }).length,
    ).toBeGreaterThanOrEqual(2);
    expectTextVisible(renderer!, '확인 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('ignores trust summary payloads that do not match the current user', async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        id: 2,
        email: 'next-user@example.com',
        nickname: '다음유저',
      },
    });
    mockedGetUserTrustSummary.mockResolvedValueOnce({
      success: true,
      message: '공급자 신뢰 요약 조회 성공',
      data: {
        userId: 1,
        completedShares: 12,
        positiveReviewCount: 9,
        matchedPhotoCount: 8,
        easyToFindCount: 7,
        badges: [
          'store_qr_verified',
          'completed_pickup',
          'positive_reviews',
        ],
        computedAt: '2026-06-04T12:10:00.000Z',
      },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    expect(mockedGetUserTrustSummary).toHaveBeenCalledWith(2);
    expectTextVisible(renderer!, '12건', false);
    expectTextVisible(renderer!, '9건', false);
    expectTextVisible(renderer!, '수령 완료 0회', true);
    expectTextVisible(renderer!, '긍정 평가 0회', true);
    expect(
      renderer!.root.findAllByProps({ children: '0건' }).length,
    ).toBeGreaterThanOrEqual(2);
    expectTextVisible(renderer!, '확인 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('does not revive an ignored trust summary during a later user switch', async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        id: 2,
        email: 'next-user@example.com',
        nickname: '다음유저',
      },
    });
    mockedGetUserTrustSummary.mockResolvedValueOnce({
      success: true,
      message: '공급자 신뢰 요약 조회 성공',
      data: {
        userId: 1,
        completedShares: 12,
        positiveReviewCount: 9,
        matchedPhotoCount: 8,
        easyToFindCount: 7,
        badges: [
          'store_qr_verified',
          'completed_pickup',
          'positive_reviews',
        ],
        computedAt: '2026-06-04T12:10:00.000Z',
      },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    mockedGetUserTrustSummary.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    ReactTestRenderer.act(() => {
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          id: 1,
          email: 'operator-test@example.com',
          nickname: '테스트',
        },
      });

      expectTextVisible(renderer!, '12건', false);
      expectTextVisible(renderer!, '9건', false);
      expectTextVisible(renderer!, '수령 완료 0회', true);
      expectTextVisible(renderer!, '긍정 평가 0회', true);
    });

    expect(mockedGetUserTrustSummary).toHaveBeenLastCalledWith(1);
    expectTextVisible(renderer!, '확인 중', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps Post-MVP menu entries out of the primary profile surface', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectTextVisible(renderer!, '관심 식재료', false);
    expectTextVisible(renderer!, '설정', false);
    expectTextVisible(renderer!, '고객센터', false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('updates nickname and profile image URL through the backend contract', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '프로필 수정').props.onPress();
    });

    const [nicknameInput, profileImageInput] =
      renderer!.root.findAllByType(TextInput);

    expect(profileImageInput.props.placeholder).toBe(
      'https://example.com/profile.jpg',
    );

    await ReactTestRenderer.act(async () => {
      nicknameInput.props.onChangeText('테스터 수정');
      profileImageInput.props.onChangeText('https://example.com/profile.jpg');
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '저장').props.onPress();
      await Promise.resolve();
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith({
      nickname: '테스터 수정',
      profileImageUrl: 'https://example.com/profile.jpg',
    });
    expect(useAuthStore.getState().user).toMatchObject({
      nickname: '테스터 수정',
      profileImageUrl: 'https://example.com/profile.jpg',
    });
    expect(alertSpy).toHaveBeenCalledWith(
      '프로필 수정 완료',
      '변경된 프로필을 저장했습니다.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
