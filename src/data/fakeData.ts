// Central fake data store — all screens pull from here

export const RAHUL = {
  id: 'u_rahul',
  name: 'Rahul Kapoor',
  initials: 'RK',
  avatar: 'https://i.pravatar.cc/150?img=8',
  bio: 'Party enthusiast 🎉 | Delhi → Mumbai | Into Bollywood nights & rooftop vibes',
  city: 'Mumbai',
  partiesAttended: 14,
  invitesSent: 6,
  savedCount: 9,
  memberSince: 'Jan 2025',
  badges: ['Early Adopter', 'Social Butterfly', 'Verified Guest'],
  referralCode: 'RAHUL100',
  referralUrl: 'https://houseparty.app/join?ref=RAHUL100',
};

export type Host = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  eventsHosted: number;
  city: string;
  verified: boolean;
  bio: string;
};

export const HOSTS: Host[] = [
  {
    id: 'h_aryan',
    name: 'Aryan K.',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rating: 4.8,
    reviewCount: 32,
    eventsHosted: 18,
    city: 'Mumbai',
    verified: true,
    bio: 'Bollywood nights & rooftop vibes. Creating memories since 2022 🎶',
  },
  {
    id: 'h_priya',
    name: 'Priya M.',
    avatar: 'https://i.pravatar.cc/150?img=47',
    rating: 4.6,
    reviewCount: 21,
    eventsHosted: 11,
    city: 'Delhi',
    verified: true,
    bio: 'Jazz & gin lover. Curating intimate gatherings in Hauz Khas 🍸',
  },
  {
    id: 'h_karan',
    name: 'Karan S.',
    avatar: 'https://i.pravatar.cc/150?img=33',
    rating: 4.4,
    reviewCount: 15,
    eventsHosted: 8,
    city: 'Bangalore',
    verified: false,
    bio: 'EDM head. Warehouse raves & underground beats 🎛️',
  },
  {
    id: 'h_ananya',
    name: 'Ananya V.',
    avatar: 'https://i.pravatar.cc/150?img=23',
    rating: 4.9,
    reviewCount: 41,
    eventsHosted: 22,
    city: 'Mumbai',
    verified: true,
    bio: "Terrace parties & curated playlists. Powai's best kept secret 🌙",
  },
  {
    id: 'h_rohit',
    name: 'Rohit D.',
    avatar: 'https://i.pravatar.cc/150?img=15',
    rating: 4.3,
    reviewCount: 9,
    eventsHosted: 5,
    city: 'Mumbai',
    verified: false,
    bio: 'New to hosting but big on vibes. Hip-hop & good food 🍕',
  },
  {
    id: 'h_simran',
    name: 'Simran T.',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 4.7,
    reviewCount: 28,
    eventsHosted: 14,
    city: 'Delhi',
    verified: true,
    bio: 'Sufi nights & shisha in SDA. Come for the music, stay for the chai 🍵',
  },
];

export type Event = {
  id: string;
  title: string;
  host: Host;
  date: string;
  area: string;
  city: string;
  coverImage: string;
  photos: string[];
  fee: number;
  spotsTotal: number;
  spotsLeft: number;
  ageMin: number;
  ageMax: number;
  metro: string;
  metroDistance: string;
  alcohol: boolean;
  smoking: boolean;
  pets: boolean;
  food: boolean;
  ac: boolean;
  wifi: boolean;
  playlist: PlaylistTrack[];
  tags: string[];
  description: string;
  status: 'upcoming' | 'closed';
  averageRating: number;
  reviews: Review[];
};

export type PlaylistTrack = {
  title: string;
  artist: string;
  duration: string;
};

export type Review = {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
};

export const EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Retro Bollywood Night',
    host: HOSTS[0],
    date: '2026-06-20T21:00:00',
    area: 'Bandra West',
    city: 'Mumbai',
    coverImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
    ],
    fee: 499,
    spotsTotal: 40,
    spotsLeft: 8,
    ageMin: 21,
    ageMax: 35,
    metro: 'Bandra',
    metroDistance: '650 m',
    alcohol: true,
    smoking: false,
    pets: false,
    food: true,
    ac: true,
    wifi: true,
    playlist: [
      { title: 'Ek Ladki Ko Dekha', artist: '1942: A Love Story', duration: '5:12' },
      { title: 'Rang De Basanti', artist: 'A.R. Rahman', duration: '4:47' },
      { title: 'Dil Se Re', artist: 'A.R. Rahman', duration: '5:33' },
      { title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', duration: '6:01' },
      { title: 'Taal Se Taal Mila', artist: 'Udit Narayan', duration: '5:44' },
      { title: 'Kuch Kuch Hota Hai', artist: 'Udit Narayan', duration: '5:28' },
    ],
    tags: ['Bollywood', 'Dance', '🍻 Bar Open', '🍕 Food'],
    description: 'A premium retro Bollywood night with curated 90s & 2000s hits, live DJ, and open bar. Think fairy lights, film posters, and the best party crowd in Bandra.',
    status: 'upcoming',
    averageRating: 0,
    reviews: [],
  },
  {
    id: 'e2',
    title: 'Sunset Jazz & Gin',
    host: HOSTS[1],
    date: '2026-06-22T19:00:00',
    area: 'Hauz Khas',
    city: 'Delhi',
    coverImage: 'https://images.unsplash.com/photo-1574271143515-5cddf8da19be?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1574271143515-5cddf8da19be?w=600&q=80',
      'https://images.unsplash.com/photo-1574091607747-66f5ac9e3f42?w=600&q=80',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
    ],
    fee: 0,
    spotsTotal: 20,
    spotsLeft: 4,
    ageMin: 23,
    ageMax: 40,
    metro: 'Hauz Khas',
    metroDistance: '400 m',
    alcohol: true,
    smoking: true,
    pets: true,
    food: false,
    ac: false,
    wifi: false,
    playlist: [
      { title: 'So What', artist: 'Miles Davis', duration: '9:22' },
      { title: 'Take Five', artist: 'Dave Brubeck Quartet', duration: '5:24' },
      { title: 'Autumn Leaves', artist: 'Bill Evans Trio', duration: '5:36' },
    ],
    tags: ['Jazz', 'Gin Bar', '🐾 Pets OK', '🚬 Smoking Zone'],
    description: 'Intimate rooftop jazz evening overlooking the Hauz Khas lake. Premium gin selections, live saxophone, and 20 carefully chosen guests.',
    status: 'upcoming',
    averageRating: 0,
    reviews: [],
  },
  {
    id: 'e3',
    title: 'EDM Warehouse Rave',
    host: HOSTS[2],
    date: '2026-06-05T22:00:00',
    area: 'Indiranagar',
    city: 'Bangalore',
    coverImage: 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=600&q=80',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      'https://images.unsplash.com/photo-1594982030943-8a3e17ff57cb?w=600&q=80',
    ],
    fee: 599,
    spotsTotal: 80,
    spotsLeft: 0,
    ageMin: 18,
    ageMax: 30,
    metro: 'Indiranagar',
    metroDistance: '1.2 km',
    alcohol: true,
    smoking: true,
    pets: false,
    food: false,
    ac: false,
    wifi: false,
    playlist: [
      { title: 'Strobe', artist: 'deadmau5', duration: '10:34' },
      { title: 'Levels', artist: 'Avicii', duration: '5:38' },
      { title: 'Titanium', artist: 'David Guetta', duration: '5:01' },
      { title: 'Animals', artist: 'Martin Garrix', duration: '5:48' },
    ],
    tags: ['EDM', 'Rave', '🍻 Bar', '🔊 Loud'],
    description: 'One-night underground warehouse rave. No frills, pure energy. Top DJs, industrial space, strobe lights.',
    status: 'closed',
    averageRating: 4.7,
    reviews: [
      {
        id: 'r1',
        user: 'Neha R.',
        avatar: 'https://i.pravatar.cc/150?img=44',
        rating: 5,
        comment: 'Best night of the year. The sound system was insane and the crowd was electric!',
        date: 'Jun 6',
      },
      {
        id: 'r2',
        user: 'Dev P.',
        avatar: 'https://i.pravatar.cc/150?img=25',
        rating: 4,
        comment: 'Amazing vibes, DJ was fire. Only wish the bar had more options.',
        date: 'Jun 6',
      },
      {
        id: 'r3',
        user: 'Sia K.',
        avatar: 'https://i.pravatar.cc/150?img=56',
        rating: 5,
        comment: 'Karan never disappoints. Already waiting for the next one!',
        date: 'Jun 7',
      },
    ],
  },
  {
    id: 'e4',
    title: 'Terrace Takeover',
    host: HOSTS[3],
    date: '2026-06-21T20:00:00',
    area: 'Powai',
    city: 'Mumbai',
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
      'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=600&q=80',
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
    ],
    fee: 0,
    spotsTotal: 30,
    spotsLeft: 11,
    ageMin: 20,
    ageMax: 35,
    metro: 'Powai',
    metroDistance: '900 m',
    alcohol: true,
    smoking: false,
    pets: true,
    food: true,
    ac: false,
    wifi: true,
    playlist: [
      { title: 'Kesariya', artist: 'Arijit Singh', duration: '4:28' },
      { title: 'Apna Bana Le', artist: 'Arijit Singh', duration: '4:12' },
      { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', duration: '3:56' },
    ],
    tags: ['Chillout', 'Rooftop', '🍕 Food', '🐾 Pets OK'],
    description: 'Late night terrace session in Powai with fairy lights, good food, and great company. Strictly curated guest list — 30 people max.',
    status: 'upcoming',
    averageRating: 0,
    reviews: [],
  },
  {
    id: 'e5',
    title: 'Hip-Hop House Cypher',
    host: HOSTS[4],
    date: '2026-06-28T22:30:00',
    area: 'Andheri West',
    city: 'Mumbai',
    coverImage: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=600&q=80',
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
    ],
    fee: 299,
    spotsTotal: 25,
    spotsLeft: 7,
    ageMin: 18,
    ageMax: 28,
    metro: 'Andheri',
    metroDistance: '750 m',
    alcohol: false,
    smoking: false,
    pets: false,
    food: true,
    ac: true,
    wifi: true,
    playlist: [
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', duration: '2:57' },
      { title: "God's Plan", artist: 'Drake', duration: '3:19' },
      { title: 'SICKO MODE', artist: 'Travis Scott', duration: '5:12' },
    ],
    tags: ['Hip-Hop', 'Cypher', '🎤 Open Mic', '🍕 Snacks'],
    description: 'First hip-hop cypher house party in Andheri. Freestyle rounds, battle rap, and a fully loaded snack table. No alcohol — vibes only.',
    status: 'upcoming',
    averageRating: 0,
    reviews: [],
  },
  {
    id: 'e6',
    title: 'Sufi Night & Shisha',
    host: HOSTS[5],
    date: '2026-06-19T21:00:00',
    area: 'SDA',
    city: 'Delhi',
    coverImage: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
      'https://images.unsplash.com/photo-1574091607747-66f5ac9e3f42?w=600&q=80',
    ],
    fee: 199,
    spotsTotal: 18,
    spotsLeft: 3,
    ageMin: 22,
    ageMax: 45,
    metro: 'IIT Delhi',
    metroDistance: '600 m',
    alcohol: false,
    smoking: true,
    pets: false,
    food: true,
    ac: false,
    wifi: false,
    playlist: [
      { title: 'Tum Ho', artist: 'Mohit Chauhan', duration: '4:31' },
      { title: 'Kun Faya Kun', artist: 'A.R. Rahman', duration: '7:52' },
      { title: 'Iktara', artist: 'Amit Trivedi', duration: '5:04' },
    ],
    tags: ['Sufi', 'Shisha', '🍵 Chai & Qawwali', '🌿 Chill'],
    description: 'An intimate Sufi night at home in SDA. Live qawwali playlist, shisha corner, and homemade biryani. Leave your shoes and your stress at the door.',
    status: 'upcoming',
    averageRating: 0,
    reviews: [],
  },
];

// Gallery posts — linked to events + users
export type GalleryPost = {
  id: string;
  eventId: string;
  eventTitle: string;
  hostName: string;
  hostAvatar: string;
  posterName: string;
  posterAvatar: string;
  image: string;
  caption: string;
  likes: number;
  date: string;
  isLiked: boolean;
};

export const GALLERY_POSTS: GalleryPost[] = [
  {
    id: 'g1',
    eventId: 'e3',
    eventTitle: 'EDM Warehouse Rave',
    hostName: 'Karan S.',
    hostAvatar: 'https://i.pravatar.cc/150?img=33',
    posterName: 'Rahul Kapoor',
    posterAvatar: 'https://i.pravatar.cc/150?img=8',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
    caption: 'What a night 🔥 @Karan_S never disappoints',
    likes: 24,
    date: 'Jun 6',
    isLiked: false,
  },
  {
    id: 'g2',
    eventId: 'e3',
    eventTitle: 'EDM Warehouse Rave',
    hostName: 'Karan S.',
    hostAvatar: 'https://i.pravatar.cc/150?img=33',
    posterName: 'Neha R.',
    posterAvatar: 'https://i.pravatar.cc/150?img=44',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
    caption: 'The lights 😍✨',
    likes: 31,
    date: 'Jun 6',
    isLiked: true,
  },
  {
    id: 'g3',
    eventId: 'e3',
    eventTitle: 'EDM Warehouse Rave',
    hostName: 'Karan S.',
    hostAvatar: 'https://i.pravatar.cc/150?img=33',
    posterName: 'Dev P.',
    posterAvatar: 'https://i.pravatar.cc/150?img=25',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    caption: 'Squad goals 💯',
    likes: 18,
    date: 'Jun 7',
    isLiked: false,
  },
  {
    id: 'g4',
    eventId: 'e3',
    eventTitle: 'EDM Warehouse Rave',
    hostName: 'Karan S.',
    hostAvatar: 'https://i.pravatar.cc/150?img=33',
    posterName: 'Sia K.',
    posterAvatar: 'https://i.pravatar.cc/150?img=56',
    image: 'https://images.unsplash.com/photo-1594982030943-8a3e17ff57cb?w=600&q=80',
    caption: 'The energy was unreal 🎛️',
    likes: 42,
    date: 'Jun 7',
    isLiked: false,
  },
];

// Chat messages with Aryan
export type ChatMessage = {
  id: string;
  from: 'me' | 'host';
  text: string;
  time: string;
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', from: 'host', text: 'Hey! Welcome 🙌 Excited to have you at Retro Bollywood Night!', time: '9:02 AM' },
  { id: 'm2', from: 'me', text: 'Thanks! Looking forward to it. Will there be seating?', time: '9:15 AM' },
  { id: 'm3', from: 'host', text: 'Yes, we have lounge seating + a dance floor. Very cozy setup!', time: '9:17 AM' },
  { id: 'm4', from: 'me', text: 'Perfect. Can I bring a friend as a plus one?', time: '9:20 AM' },
  { id: 'm5', from: 'host', text: 'Absolutely! Just make sure they RSVP separately since spots are limited 🎟️', time: '9:22 AM' },
];

// Nearby hosts for the radar screen
export type NearbyHost = Host & {
  distance: string;
  distanceM: number;
  angle: number;
  nextEvent?: string;
};

export const NEARBY_HOSTS: NearbyHost[] = [
  { ...HOSTS[0], distance: '320 m',  distanceM: 320,  angle: 45,  nextEvent: 'Retro Bollywood Night' },
  { ...HOSTS[3], distance: '680 m',  distanceM: 680,  angle: 230, nextEvent: 'Terrace Takeover' },
  { ...HOSTS[4], distance: '1.1 km', distanceM: 1100, angle: 140, nextEvent: 'Hip-Hop House Cypher' },
  { ...HOSTS[1], distance: '1.8 km', distanceM: 1800, angle: 310, nextEvent: 'Sunset Jazz & Gin' },
  { ...HOSTS[2], distance: '2.6 km', distanceM: 2600, angle: 75,  nextEvent: undefined },
  { ...HOSTS[5], distance: '3.2 km', distanceM: 3200, angle: 195, nextEvent: 'Sufi Night & Shisha' },
];

// Saved events (ids)
export const SAVED_EVENT_IDS = ['e1', 'e2'];
