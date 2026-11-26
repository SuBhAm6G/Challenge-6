export { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from './demo-defaults.ts';

export interface IndianCityPreset {
  id: string;
  city: string;
  state: string;
  defaultLocality: string;
  latitude: number;
  longitude: number;
  winterSmogNote: string;
}

export const INDIAN_CITIES: readonly IndianCityPreset[] = [
  {
    id: 'delhi',
    city: 'New Delhi',
    state: 'Delhi NCT',
    defaultLocality: 'Dwarka / Central Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    winterSmogNote: 'Severe winter inversion & regional smoke episodes (Oct–Jan)',
  },
  {
    id: 'noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    defaultLocality: 'Sector 62',
    latitude: 28.5355,
    longitude: 77.391,
    winterSmogNote: 'NCR airshed; construction dust and morning traffic peaks',
  },
  {
    id: 'gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    defaultLocality: 'DLF Phase / Sohna Rd',
    latitude: 28.4595,
    longitude: 77.0266,
    winterSmogNote: 'NCR highway corridors and winter temperature inversion',
  },
  {
    id: 'ghaziabad',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    defaultLocality: 'Indirapuram',
    latitude: 28.6692,
    longitude: 77.4538,
    winterSmogNote: 'High winter PM2.5 accumulation across eastern NCR',
  },
  {
    id: 'lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    defaultLocality: 'Gomti Nagar',
    latitude: 26.8467,
    longitude: 80.9462,
    winterSmogNote: 'Indo-Gangetic plain winter fog and biomass smoke trapping',
  },
  {
    id: 'patna',
    city: 'Patna',
    state: 'Bihar',
    defaultLocality: 'Kankarbagh',
    latitude: 25.5941,
    longitude: 85.1376,
    winterSmogNote: 'Indo-Gangetic basin particulate buildup in calm winter nights',
  },
  {
    id: 'jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    defaultLocality: 'Malviya Nagar',
    latitude: 26.9124,
    longitude: 75.7873,
    winterSmogNote: 'Coarse dust (PM10) combined with winter urban traffic',
  },
  {
    id: 'chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    defaultLocality: 'Sector 17',
    latitude: 30.7333,
    longitude: 76.7794,
    winterSmogNote: 'Seasonal post-monsoon and winter haze events',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    defaultLocality: 'Bandra / Andheri',
    latitude: 19.076,
    longitude: 72.8777,
    winterSmogNote: 'Coastal breeze shifts in winter slow down pollutant dispersion',
  },
  {
    id: 'pune',
    city: 'Pune',
    state: 'Maharashtra',
    defaultLocality: 'Kothrud',
    latitude: 18.5204,
    longitude: 73.8567,
    winterSmogNote: 'Morning valley haze and growing commuter corridors',
  },
  {
    id: 'ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    defaultLocality: 'Navrangpura',
    latitude: 23.0225,
    longitude: 72.5714,
    winterSmogNote: 'Dry winter particulates and industrial-corridor influence',
  },
  {
    id: 'kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    defaultLocality: 'Salt Lake',
    latitude: 22.5726,
    longitude: 88.3639,
    winterSmogNote: 'Calm winter evenings elevate PM2.5 and traffic NO₂',
  },
  {
    id: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    defaultLocality: 'Indiranagar',
    latitude: 12.9716,
    longitude: 77.5946,
    winterSmogNote: 'Corridor dust and peak-hour traffic exposure hotspots',
  },
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    defaultLocality: 'Madhapur',
    latitude: 17.385,
    longitude: 78.4867,
    winterSmogNote: 'Dry-season road dust and morning inversion haze',
  },
  {
    id: 'chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    defaultLocality: 'Adyar',
    latitude: 13.0827,
    longitude: 80.2707,
    winterSmogNote: 'Generally moderated by sea breeze; local traffic pockets vary',
  },
] as const;
