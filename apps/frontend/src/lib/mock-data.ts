import type { Character, Player } from './types';

export const MOCK_ROOM_CODE = 'K7Q-29P';

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Sagar',
    status: 'host',
    isYou: true,
    characterConfirmed: false,
    avatarUrl:
      'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
  {
    id: 'p2',
    name: 'Rahul',
    status: 'connected',
    isYou: false,
    characterConfirmed: false,
    avatarUrl:
      'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
];

export const MOCK_CHARACTERS: Character[] = [
  {
    id: 'c1',
    name: 'Lionel Messi',
    archetype: 'Footballer',
    imageUrl:
      'https://images.pexels.com/photos/27642339/pexels-photo-27642339.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 97,
  },
  {
    id: 'c2',
    name: 'Cristiano Ronaldo',
    archetype: 'Footballer',
    imageUrl:
      'https://images.pexels.com/photos/1657324/pexels-photo-1657324.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 95,
  },
  {
    id: 'c3',
    name: 'Taylor Swift',
    archetype: 'Singer',
    imageUrl:
      'https://images.pexels.com/photos/7715782/pexels-photo-7715782.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 99,
  },
  {
    id: 'c4',
    name: 'Albert Einstein',
    archetype: 'Scientist',
    imageUrl:
      'https://images.pexels.com/photos/8442615/pexels-photo-8442615.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 94,
  },
  {
    id: 'c5',
    name: 'Spider-Man',
    archetype: 'Superhero',
    imageUrl:
      'https://images.pexels.com/photos/38691366/pexels-photo-38691366.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 91,
  },
  {
    id: 'c6',
    name: 'Sherlock Holmes',
    archetype: 'Detective',
    imageUrl:
      'https://images.pexels.com/photos/36745391/pexels-photo-36745391.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 88,
  },
  {
    id: 'c7',
    name: 'Bear Grylls',
    archetype: 'Explorer',
    imageUrl:
      'https://images.pexels.com/photos/8968842/pexels-photo-8968842.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 90,
  },
  {
    id: 'c8',
    name: 'Freddie Mercury',
    archetype: 'Musician',
    imageUrl:
      'https://images.pexels.com/photos/5351021/pexels-photo-5351021.png?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    confidence: 96,
  },
];

export const MOCK_CHAT_SEED = [
  { senderId: 'p1', senderName: 'Sagar', text: 'Is your person a footballer?' },
  { senderId: 'p2', senderName: 'Rahul', text: 'Yeah 😂' },
  { senderId: 'p1', senderName: 'Sagar', text: 'Did they play in Spain?' },
  { senderId: 'p2', senderName: 'Rahul', text: 'Yes.' },
  { senderId: 'p1', senderName: 'Sagar', text: 'Are they from Argentina?' },
  { senderId: 'p2', senderName: 'Rahul', text: '...' },
];

export const MOCK_OPPONENT_REPLIES = [
  'Hmm, good question...',
  'Yeah!',
  'No, not really.',
  "I'm not sure about that one.",
  'You are getting close!',
  'Haha, maybe...',
  'Yes, that is true.',
  'No way!',
  '...',
];

export const HOW_TO_PLAY_STEPS = [
  { num: '01', title: 'Create a room', desc: 'Start a private game and share the code with a friend.' },
  { num: '02', title: 'Pick someone', desc: 'Upload or choose a character for your friend to guess.' },
  { num: '03', title: 'Meet face to face', desc: 'See each other on video and get ready to play.' },
  { num: '04', title: 'Ask questions', desc: 'Talk naturally and narrow down who the mystery person is.' },
  { num: '05', title: 'Make your guess', desc: 'One shot. Name the mystery person before your friend does.' },
  { num: '06', title: 'Reveal', desc: 'The answer is shown. Did you get it right?' },
];
