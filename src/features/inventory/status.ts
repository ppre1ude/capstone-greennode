export type InventoryDisplayStatus =
  | 'pending_store'
  | 'stored'
  | 'available'
  | 'requested'
  | 'pickup_hold'
  | 'picked_up'
  | 'expired'
  | 'dispose_needed';

export type InventoryStatusTone =
  | 'neutral'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger';

export type InventoryProgressStepState =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'problem';

export type InventoryStatusDisplay = {
  status: InventoryDisplayStatus;
  label: string;
  description: string;
  tone: InventoryStatusTone;
};

export type InventoryProgressStep = {
  key: 'store' | 'available' | 'pickup_hold' | 'picked_up';
  label: string;
  state: InventoryProgressStepState;
};

export const INVENTORY_STATUS_DISPLAY: Record<
  InventoryDisplayStatus,
  InventoryStatusDisplay
> = {
  pending_store: {
    status: 'pending_store',
    label: '등록 대기',
    description: '냉장고 보관 인증을 기다리는 상태',
    tone: 'warning',
  },
  stored: {
    status: 'stored',
    label: '보관 완료',
    description: '공유 냉장고 재고에 보관된 상태',
    tone: 'success',
  },
  available: {
    status: 'available',
    label: '신청 가능',
    description: '수요자가 신청할 수 있는 상태',
    tone: 'success',
  },
  requested: {
    status: 'requested',
    label: '신청 접수',
    description: '수요자의 30분 임시 선점 상태',
    tone: 'info',
  },
  pickup_hold: {
    status: 'pickup_hold',
    label: '수령 대기',
    description: '수령 QR 인증을 기다리는 상태',
    tone: 'warning',
  },
  picked_up: {
    status: 'picked_up',
    label: '수령 완료',
    description: '수령 확인이 완료된 상태',
    tone: 'success',
  },
  expired: {
    status: 'expired',
    label: '만료됨',
    description: '임시 선점 시간이 만료된 상태',
    tone: 'danger',
  },
  dispose_needed: {
    status: 'dispose_needed',
    label: '폐기 필요',
    description: '운영자의 폐기 또는 회수 확인이 필요한 상태',
    tone: 'danger',
  },
};

const PROGRESS_TEMPLATE: Omit<InventoryProgressStep, 'state'>[] = [
  {key: 'store', label: '보관'},
  {key: 'available', label: '신청 가능'},
  {key: 'pickup_hold', label: '수령 대기'},
  {key: 'picked_up', label: '수령 완료'},
];

const CURRENT_STEP_INDEX: Record<InventoryDisplayStatus, number> = {
  pending_store: 0,
  stored: 1,
  available: 1,
  requested: 2,
  pickup_hold: 2,
  picked_up: 3,
  expired: 2,
  dispose_needed: 2,
};

const PROBLEM_STATUSES = new Set<InventoryDisplayStatus>([
  'expired',
  'dispose_needed',
]);

export const getInventoryStatusDisplay = (
  status: InventoryDisplayStatus,
): InventoryStatusDisplay => INVENTORY_STATUS_DISPLAY[status];

export const getInventoryProgressSteps = (
  status: InventoryDisplayStatus,
): InventoryProgressStep[] => {
  const currentIndex = CURRENT_STEP_INDEX[status];

  return PROGRESS_TEMPLATE.map((step, index) => {
    let state: InventoryProgressStepState = 'upcoming';

    if (index < currentIndex) {
      state = 'completed';
    } else if (index === currentIndex) {
      state = PROBLEM_STATUSES.has(status) ? 'problem' : 'current';
    }

    return {...step, state};
  });
};
