import type { StateCreator } from 'zustand';
import type { StorageResult } from '../storage/db.ts';
import { LocalStorageRepo } from '../storage/repositories.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_DEMO_HOUSEHOLD,
  DEFAULT_INDOOR_PROFILE,
} from './defaults.ts';
import type { AppStoreState } from './types.ts';

function persistStatePatch(
  res: StorageResult<unknown>,
): Pick<AppStoreState, 'saveStatus' | 'storageWarning'> {
  return {
    saveStatus: res.ok ? 'saved' : 'error',
    storageWarning: res.message ?? null,
  };
}

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

/**
 * Zustand slice managing household context, indoor setup, alerts, routine progress,
 * impact history, and community organizer persistence.
 */
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
    set(persistStatePatch(await LocalStorageRepo.saveHouseholdProfile(stamped)));
  },

  updateIndoorProfile: async (profile) => {
    const stamped = { ...profile, updatedAt: new Date().toISOString() };
    set({ indoorProfile: stamped, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveIndoorProfile(stamped)));
  },

  updateAlertPreferences: async (prefs) => {
    set({ alertPreferences: prefs, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveAlertPreferences(prefs)));
  },

  setRoutineStatus: async (recId, status) => {
    const next = { ...get().routineStatuses, [recId]: status };
    set({ routineStatuses: next, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveRoutineStatuses(next)));
  },

  toggleIndoorAction: async (actionId) => {
    const curr = get().completedIndoorActionIds;
    const next = curr.includes(actionId) ? curr.filter((x) => x !== actionId) : [...curr, actionId];
    set({ completedIndoorActionIds: next, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveCompletedIndoorActionIds(next)));
  },

  recordImpactEntry: async (entry) => {
    const next = [entry, ...get().impactHistory].slice(0, 100);
    set({ impactHistory: next, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveImpactHistory(next)));
  },

  updateCommunityPlan: async (plan) => {
    const stamped = { ...plan, updatedAt: new Date().toISOString() };
    set({ communityPlan: stamped, saveStatus: 'saving' });
    set(persistStatePatch(await LocalStorageRepo.saveCommunityPlan(stamped)));
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
