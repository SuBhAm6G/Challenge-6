import type { CommunityAction, CommunityPlan } from '../domain/community/types.ts';

export const COMMUNITY_TEMPLATE_ACTIONS: readonly CommunityAction[] = [
  {
    id: 'comm-no-burning',
    title: 'Enforce zero leaf, garden-waste, and guard-bonfire burning in premises',
    responsibleRole: 'RWA Security & Housekeeping Lead',
    suggestedDeadline: 'Immediate (Winter season)',
    status: 'planned',
    effort: 'low',
    explanation:
      'Open burning of dry leaves and night-watchman wood/plastic fires creates intense local PM2.5 plumes inside residential compounds. Provide electric heaters or warm gear for night guards instead.',
    evidenceId: 'cpcb-naqi',
  },
  {
    id: 'comm-school-protocol',
    title: 'Adopt an AQI-tiered outdoor assembly & sports schedule for children',
    responsibleRole: 'School / Society Sports Coordinator',
    suggestedDeadline: 'This week',
    status: 'planned',
    effort: 'moderate',
    explanation:
      'Move morning PT, assemblies, and intense outdoor matches to indoor halls or afternoon lower-AQI windows when local NAQI reaches Poor or above.',
    evidenceId: 'cpcb-naqi',
  },
  {
    id: 'comm-carpool-board',
    title: 'Coordinate a verified parent & commuter carpool group by route',
    responsibleRole: 'Community Transport Volunteer',
    suggestedDeadline: 'Within 7 days',
    status: 'planned',
    effort: 'moderate',
    explanation:
      'Consolidating two or three solo school/office car trips along the same corridor reduces vehicle kilometres and gate congestion without leaving commuters stranded.',
    evidenceId: 'india-ghg-transport',
  },
  {
    id: 'comm-no-idling',
    title: 'Set up "Engine Off" zones at school gates and society pickup bays',
    responsibleRole: 'Gate Volunteers & Guards',
    suggestedDeadline: 'Within 3 days',
    status: 'planned',
    effort: 'low',
    explanation:
      'Waiting cars and buses with engines idling emit concentrated NO₂ and exhaust right where children walk and wait.',
    evidenceId: 'who-aqg-2021',
  },
  {
    id: 'comm-construction-cover',
    title: 'Require water sprinkling & green-mesh dust barriers for society repairs',
    responsibleRole: 'Maintenance Committee',
    suggestedDeadline: 'Ongoing',
    status: 'planned',
    effort: 'moderate',
    explanation:
      'Uncovered renovation debris and dry sweeping spike local PM10 levels across neighbouring flats.',
    evidenceId: 'cpcb-naqi',
  },
];

export const DEFAULT_COMMUNITY_PLAN: CommunityPlan = {
  id: 'comm-plan-default',
  communityName: 'Sector 10 Residents Welfare & School Group (Local Workspace)',
  city: 'New Delhi',
  organizerRole: 'rwa_coordinator',
  actions: [...COMMUNITY_TEMPLATE_ACTIONS],
  updatedAt: '2026-11-25T08:00:00.000Z',
};
