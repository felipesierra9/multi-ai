import { MediaType } from './generation.models';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalGenerations: number;
  imageGenerations: number;
  videoGenerations: number;
  audioGenerations: number;
  textGenerations: number;
  topProvider: string | null;
  busiestDay: string | null;
  topUser: string | null;
  activityByDay: ChartPoint[];
  activityByMonth: ChartPoint[];
  registrationsByMonth: ChartPoint[];
  byCategory: ChartPoint[];
  byProvider: ChartPoint[];
}

export interface StatisticsFilters {
  from?: string;
  to?: string;
  user?: string;
  mediaType?: MediaType | '';
  provider?: string;
}
