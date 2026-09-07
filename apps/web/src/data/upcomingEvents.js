const occurrence = (date, timeLabel = '6:30-8:30 p.m.', startTime = '18:30:00', endTime = '20:30:00') => ({
  start: `${date}T${startTime}-06:00`,
  end: `${date}T${endTime}-06:00`,
  dateLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)),
  timeLabel,
});

export const upcomingEvents = [
  {
    id: 'ai-everyday-life-winter-2027',
    title: 'AI for Everyday Life',
    partner: 'Park Ridge Park District',
    format: 'Four-session course',
    audience: 'General adults',
    description: 'A beginner-friendly course for using AI to plan, organize, write, research, learn, and solve everyday problems safely and effectively.',
    occurrences: [
      occurrence('2027-01-07'),
      occurrence('2027-01-14'),
      occurrence('2027-01-21'),
      occurrence('2027-01-28'),
    ],
    location: { name: 'Centennial Activity Center', address: '100 S. Western Ave., Park Ridge, IL 60068' },
    registrationUrl: null,
    status: 'coming-soon',
  },
  {
    id: 'ai-adults-55-winter-2027',
    title: 'AI for Adults 55+',
    partner: 'Park Ridge Park District',
    format: 'Monthly workshop',
    audience: 'Adults 55+',
    description: 'A friendly, hands-on workshop for using AI with writing, planning, travel, hobbies, and everyday tasks while recognizing scams, misinformation, and privacy risks.',
    occurrences: [
      occurrence('2027-01-12', '10:00 a.m.-12:00 p.m.', '10:00:00', '12:00:00'),
      occurrence('2027-02-09', '10:00 a.m.-12:00 p.m.', '10:00:00', '12:00:00'),
      occurrence('2027-03-09', '10:00 a.m.-12:00 p.m.', '10:00:00', '12:00:00'),
    ],
    location: { name: 'Centennial Activity Center', address: '100 S. Western Ave., Park Ridge, IL 60068' },
    registrationUrl: null,
    status: 'coming-soon',
  },
  {
    id: 'understanding-ai-library-2027',
    title: 'Understanding AI',
    partner: 'Park Ridge Public Library',
    format: 'Community lecture',
    audience: 'General adults',
    description: 'An approachable introduction to what modern AI is, where people already encounter it, what it does well, and where it can fail.',
    occurrences: [occurrence('2027-02-02', '7:00-8:00 p.m.', '19:00:00', '20:00:00')],
    location: { name: 'Park Ridge Public Library - First Floor Meeting Room', address: '20 S. Prospect Ave., Park Ridge, IL 60068' },
    registrationUrl: null,
    status: 'coming-soon',
  },
  {
    id: 'ai-for-parents-winter-2027',
    title: 'AI for Parents',
    partner: 'Park Ridge Park District',
    format: 'Four-session course',
    audience: 'Parents and caregivers',
    description: 'Practical guidance for parents and caregivers navigating AI in homework, learning, creativity, online content, privacy, and family communication.',
    occurrences: [
      occurrence('2027-02-04'),
      occurrence('2027-02-11'),
      occurrence('2027-02-18'),
      occurrence('2027-02-25'),
    ],
    location: { name: 'Centennial Activity Center', address: '100 S. Western Ave., Park Ridge, IL 60068' },
    registrationUrl: null,
    status: 'coming-soon',
  },
];

export default upcomingEvents;
