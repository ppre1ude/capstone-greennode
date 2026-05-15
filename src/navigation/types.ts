/**
 * Navigation 타입 정의
 * 모든 화면의 route params를 여기서 중앙 관리
 */
import type {NavigatorScreenParams} from '@react-navigation/native';
import type {GenerateResult, PostCreateData} from '@/types';

/** Auth 스택 (비로그인 상태) */
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  LoginEmail: undefined;
  Signup: undefined;
};

/** 메인 탭 (로그인 완료 후) */
export type MainTabParamList = {
  Home:
    | {
        nearbyPostsRefreshToken?: number;
        completedPostId?: number;
      }
    | undefined;
  Map: undefined;
  CameraDummy: undefined;
  Chat: undefined;
  Profile: undefined;
};

/** 루트 스택 (앱 전체) */
export type RootStackParamList = {
  Auth: undefined;
  LocationSetup: {allowBack?: boolean} | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  CameraScan: undefined;
  AnalysisResult: {result: GenerateResult; imageUri: string};
  PostCreate: {result: GenerateResult; imageUri: string};
  PostComplete: {postId: number};
  PostDetail: {postId: number};
  FridgeOperatorConsole: undefined;
  FridgeSelect: {
    postData?: Omit<PostCreateData, 'fridgeId'>;
    qualityCategory?: string;
    qualityCanShare?: boolean;
    latitude?: number;
    longitude?: number;
  };
};
