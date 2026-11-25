import type { StateCreator } from 'zustand';
import { LocalStorageRepo } from '../storage/repositories.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_DEMO_HOUSEHOLD,
  DEFAULT_INDOOR_PROFILE,
} from './defaults.ts';
import type { AppStoreState } from './types.ts';

export type PlanningSlice = Pick<
  AppStoreState,
  | 'householdProfile'
  | 'indoorProfile'
  | 'alertPreferences'
  | 'routineStatuses'
  | 'completedIndoorActionIds'
  | 'impactHistory'
  | 'communityPlan'
  | 'updateHouseholdProfile'
  | 'updateIndoorProfile'
  | 'updateAlertPreferences'
  | 'setRoutineStatus'
  | 'toggleIndoorAction'
  | 'recordImpactEntry'
  | 'updateCommunityPlan'
  | 'updateCommunityActionStatus'
  | 'addCommunityAction'
>;

export const createPlanningSlice: StateCreator<AppStoreState, [], [], PlanningSlice> = (
  set,
  get,
) => ({
  householdProfile: DEFAULT_DEMO_HOUSEHOLD,
  indoorProfile: DEFAULT_INDOOR_PROFILE,
  alertPreferences: DEFAULT_ALERT_PREFERENCES,
  routineStatuses: {},
  completedIndoorActionIds: [],
  impactHistory: [],
  communityPlan: DEFAULT_COMMUNITY_PLAN,

  updateHouseholdProfile: async (profile) => {
    const stamped = { ...profile, updatedAt: new Date().toISOString() };
    set({ householdProfile: stamped, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveHouseholdProfile(stamped);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  updateIndoorProfile: async (profile) => {
    const stamped = { ...profile, updatedAt: new Date().toISOString() };
    set({ indoorProfile: stamped, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveIndoorProfile(stamped);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  updateAlertPreferences: async (prefs) => {
    set({ alertPreferences: prefs, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveAlertPreferences(prefs);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  setRoutineStatus: async (recId, status) => {
    const next = { ...get().routineStatuses, [recId]: status };
    set({ routineStatuses: next, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveRoutineStatuses(next);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  toggleIndoorAction: async (actionId) => {
    const curr = get().completedIndoorActionIds;
    const next = curr.includes(actionId) ? curr.filter((x) => x !== actionId) : [...curr, actionId];
    set({ completedIndoorActionIds: next, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveCompletedIndoorActionIds(next);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  recordImpactEntry: async (entry) => {
    const next = [entry, ...get().impactHistory].slice(0, 100);
    set({ impactHistory: next, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveImpactHistory(next);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  updateCommunityPlan: async (plan) => {
    const stamped = { ...plan, updatedAt: new Date().toISOString() };
    set({ communityPlan: stamped, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveCommunityPlan(stamped);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
  },

  updateCommunityActionStatus: async (actionId, status) => {
    const curr = get().communityPlan;
    await get().updateCommunityPlan({
      ...curr,
      actions: curr.actions.map((a) => (a.id === actionId ? { ...a, status } : a)),
    });
  },

  addCommunityAction: async (action) => {
    const curr = get().communityPlan;
    await get().updateCommunityPlan({ ...curr, actions: [action, ...curr.actions] });
  },
});
