import { LeadStage } from './interface/type';

const STAGE_SEQUENCE: LeadStage[] = [
  LeadStage.NEW_LEAD,
  LeadStage.FIRST_TALK_DONE,
  LeadStage.FOLLOWING_UP,
  LeadStage.CLIENT_INTERESTED,
  LeadStage.ACCOUNT_OPENED,
  LeadStage.NO_RESPONSE_DORMANT,
  LeadStage.NOT_INTERESTED_DORMANT,
  LeadStage.RISKY_CLIENT_DORMANT,
  LeadStage.HIBERNATED,
];

const STAGE_META: Record<LeadStage, { label: string; pillClass: string; barClass: string }> = {
  [LeadStage.NEW_LEAD]: {
    label: 'New leads',
    pillClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
    barClass: 'bg-blue-400',
  },
  [LeadStage.FIRST_TALK_DONE]: {
    label: 'First talk done',
    pillClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    barClass: 'bg-sky-400',
  },
  [LeadStage.FOLLOWING_UP]: {
    label: 'Following up',
    pillClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200',
    barClass: 'bg-indigo-400',
  },
  [LeadStage.CLIENT_INTERESTED]: {
    label: 'Client interested',
    pillClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    barClass: 'bg-emerald-400',
  },
  [LeadStage.ACCOUNT_OPENED]: {
    label: 'Account opened',
    pillClass: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200',
    barClass: 'bg-teal-400',
  },
  [LeadStage.NO_RESPONSE_DORMANT]: {
    label: 'No response - dormant',
    pillClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    barClass: 'bg-amber-400',
  },
  [LeadStage.NOT_INTERESTED_DORMANT]: {
    label: 'Not interested - dormant',
    pillClass: 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    barClass: 'bg-orange-400',
  },
  [LeadStage.RISKY_CLIENT_DORMANT]: {
    label: 'Risky client - dormant',
    pillClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    barClass: 'bg-rose-400',
  },
  [LeadStage.HIBERNATED]: {
    label: 'Hibernated',
    pillClass: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100',
    barClass: 'bg-slate-400',
  },
};

export { STAGE_SEQUENCE, STAGE_META };
