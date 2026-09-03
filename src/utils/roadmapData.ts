import { Card, RoadmapChapter, RoadmapNode, IELTSSpeakingQuestion, SpeakingRoadmapProfile } from '../types';

const ROADMAP_STORAGE_KEY = 'learning_english_roadmap_ielts_fspeaking_progress';
const ROADMAP_CUSTOM_PROFILES_KEY = 'learning_english_custom_roadmap_profiles';
const ROADMAP_ACTIVE_PROFILE_KEY = 'learning_english_active_roadmap_profile_id';

export interface RoadmapProgress {
  unlockedNodeIds: string[];
  completedNodeIds: string[];
  nodeStars: Record<string, number>;
}

export function getRoadmapProgress(): RoadmapProgress {
  if (typeof window === 'undefined') {
    return { unlockedNodeIds: ['p1-u1-intro', 'ielts-p1-routine'], completedNodeIds: [], nodeStars: {} };
  }
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) {
      return { unlockedNodeIds: ['p1-u1-intro', 'ielts-p1-routine'], completedNodeIds: [], nodeStars: {} };
    }
    return JSON.parse(raw);
  } catch {
    return { unlockedNodeIds: ['p1-u1-intro', 'ielts-p1-routine'], completedNodeIds: [], nodeStars: {} };
  }
}

export function saveRoadmapProgress(progress: RoadmapProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export function markNodeComplete(nodeId: string, stars: number = 3, nextNodeId?: string): RoadmapProgress {
  const current = getRoadmapProgress();
  const completed = Array.from(new Set([...current.completedNodeIds, nodeId]));
  const unlocked = Array.from(new Set([...current.unlockedNodeIds, ...(nextNodeId ? [nextNodeId] : [])]));
  const nodeStars = {
    ...current.nodeStars,
    [nodeId]: Math.max(current.nodeStars[nodeId] || 0, stars),
  };

  const updated: RoadmapProgress = {
    unlockedNodeIds: unlocked,
    completedNodeIds: completed,
    nodeStars,
  };

  saveRoadmapProgress(updated);
  return updated;
}

export function getNextNodeId(nodeId: string): string | undefined {
  const chapters = getRoadmapChapters();
  const allNodes = chapters.flatMap((c) => c.nodes);
  const idx = allNodes.findIndex((n) => n.id === nodeId);
  if (idx !== -1 && idx + 1 < allNodes.length) {
    return allNodes[idx + 1].id;
  }
  return undefined;
}

// Helper to create vocabulary cards
function createCards(deckId: string, list: { front: string; back: string; phonetic?: string; pos?: string; example?: string }[]): Card[] {
  return list.map((item, idx) => ({
    id: `card-${deckId}-${idx}`,
    deckId,
    front: item.front,
    back: item.back,
    phonetic: item.phonetic,
    partOfSpeech: item.pos,
    example: item.example,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    level: 0,
    nextReview: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

export function getPresetRoadmapProfiles(): SpeakingRoadmapProfile[] {
  return [
    {
      id: 'fspeaking-curriculum',
      name: 'Lộ Trình IELTS Speaking (Theo Giáo Trình F:\\Speaking)',
      description: 'Toàn bộ 10 Unit Part 1, Part 2 Cue Cards & Kỹ thuật Idea Extension, và Part 3 Công thức Reason & Example từ tài liệu F:\\Speaking.',
      category: 'ielts',
      icon: '📚',
      targetBand: 'Band 7.5 - 9.0+',
      chapters: getFSpeakingChapters(),
    },
    {
      id: 'business-pro',
      name: 'Lộ Trình Giao Tiếp Công Sở & Phỏng Vấn (Business Pro)',
      description: 'Luyện nói thuyết trình dự án, đàm phán hợp đồng, họp hội nghị quốc tế và phỏng vấn việc làm lương cao.',
      category: 'business',
      icon: '💼',
      targetBand: 'C1 Professional',
      chapters: getBusinessChapters(),
    },
    {
      id: 'daily-travel',
      name: 'Lộ Trình Giao Tiếp Cuộc Sống & Du Lịch (Daily Life & Travel)',
      description: 'Thực hành đàm thoại đời thường, đặt phòng khách sạn, giao lưu bạn bè quốc tế và định cư nước ngoài.',
      category: 'daily',
      icon: '✈️',
      targetBand: 'B2 Fluent',
      chapters: getDailyTravelChapters(),
    },
  ];
}

export function getCustomRoadmapProfiles(): SpeakingRoadmapProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ROADMAP_CUSTOM_PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomRoadmapProfile(profile: SpeakingRoadmapProfile): SpeakingRoadmapProfile[] {
  const existing = getCustomRoadmapProfiles();
  const filtered = existing.filter((p) => p.id !== profile.id);
  const updated = [profile, ...filtered];
  try {
    localStorage.setItem(ROADMAP_CUSTOM_PROFILES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function deleteCustomRoadmapProfile(id: string): void {
  const existing = getCustomRoadmapProfiles();
  const updated = existing.filter((p) => p.id !== id);
  try {
    localStorage.setItem(ROADMAP_CUSTOM_PROFILES_KEY, JSON.stringify(updated));
  } catch {}
  if (getActiveRoadmapProfileId() === id) {
    setActiveRoadmapProfileId('fspeaking-curriculum');
  }
}

export function getActiveRoadmapProfileId(): string {
  if (typeof window === 'undefined') return 'fspeaking-curriculum';
  return localStorage.getItem(ROADMAP_ACTIVE_PROFILE_KEY) || 'fspeaking-curriculum';
}

export function setActiveRoadmapProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROADMAP_ACTIVE_PROFILE_KEY, id);
}

export function getActiveRoadmapProfile(): SpeakingRoadmapProfile {
  const activeId = getActiveRoadmapProfileId();
  const allProfiles = [...getPresetRoadmapProfiles(), ...getCustomRoadmapProfiles()];
  return allProfiles.find((p) => p.id === activeId) || allProfiles[0];
}

export function getRoadmapChapters(): RoadmapChapter[] {
  const activeProfile = getActiveRoadmapProfile();
  return activeProfile.chapters;
}

// Exact curriculum from F:\Speaking
function getFSpeakingChapters(): RoadmapChapter[] {
  const progress = getRoadmapProgress();
  const isUnlocked = (id: string) => progress.unlockedNodeIds.includes(id) || id === 'p1-u1-intro';
  const isCompleted = (id: string) => progress.completedNodeIds.includes(id);
  const getStars = (id: string) => progress.nodeStars[id] || 0;

  return [
    {
      id: 'fspeaking-part-1',
      title: 'CHAPTER 1. IELTS SPEAKING PART 1 (GIÁO TRÌNH F:\\SPEAKING)',
      subtitle: 'Toàn bộ 10 Unit: Friendship, Text Messages, Travelling, Transportation, Swimming, Snacks...',
      part: 'Part 1',
      band: 'Band 6.5 - 7.5',
      color: '#3B82F6',
      nodes: [
        {
          id: 'p1-u1-intro',
          title: 'Unit 1: Giới Thiệu & Mở Rộng Câu Trả Lời',
          subtitle: 'Kỹ thuật mở rộng câu trả lời tự nhiên Part 1',
          icon: '👋',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u1-intro'),
          isUnlocked: true,
          isCompleted: isCompleted('p1-u1-intro'),
          xpReward: 35,
          questions: [
            {
              question: 'How do you extend your answers in Speaking Part 1 naturally?',
              sampleAnswer: 'To extend answers naturally, I provide a direct response followed by reasons, specific personal examples, and frequency details to sound spontaneous.',
              keyVocab: ['extend answers', 'direct response', 'spontaneous', 'personal examples'],
              tips: 'Áp dụng công thức: Trả lời trực tiếp + Lý do giải thích + Ví dụ thực tế.',
            },
          ],
          cards: createCards('p1-u1-intro', [
            { front: 'Spontaneous response', back: 'Câu trả lời tự nhiên, không học vẹt', phonetic: '/spɑːnˈteɪ.ni.əs rɪˈspɑːns/', pos: 'collocation', example: 'Examiners appreciate spontaneous responses.' },
            { front: 'Elaborate on ideas', back: 'Mở rộng và phát triển ý tưởng', phonetic: '/iˈlæb.ə.reɪt ɑːn aɪˈdiː.əz/', pos: 'phrase', example: 'Always elaborate on your ideas with reasons.' },
            { front: 'Discourse markers', back: 'Từ nối liên kết câu tự nhiên (Well, Actually, To be honest)', phonetic: '/ˈdɪs.kɔːrs ˌmɑːr.kɚz/', pos: 'noun', example: 'Use discourse markers to sound more fluent.' },
          ]),
        },
        {
          id: 'p1-u2-friendship',
          title: 'Unit 2: Friendship (Tình Bạn)',
          subtitle: 'Bài tập bổ trợ chủ đề Tình Bạn',
          icon: '🤝',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u2-friendship'),
          isUnlocked: isUnlocked('p1-u2-friendship'),
          isCompleted: isCompleted('p1-u2-friendship'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you have a lot of friends?',
              sampleAnswer: 'To be honest, I prefer quality over quantity when it comes to friendship. I have a small, tight-knit circle of close friends who are always supportive through thick and thin.',
              keyVocab: ['quality over quantity', 'tight-knit circle', 'through thick and thin', 'confide in'],
            },
            {
              question: 'What qualities do you look for in a close friend?',
              sampleAnswer: 'For me, trustworthiness and mutual respect are paramount. A true friend should be someone I can confide in without hesitation.',
              keyVocab: ['trustworthiness', 'mutual respect', 'confide in', 'paramount'],
            },
          ],
          cards: createCards('p1-u2-friendship', [
            { front: 'Tight-knit circle', back: 'Vòng tròn bạn bè gắn kết khăng khít', phonetic: '/ˌtaɪt.nɪt ˈsɝː.kəl/', pos: 'collocation', example: 'I value my tight-knit circle of close friends.' },
            { front: 'Through thick and thin', back: 'Cùng nhau trải qua mọi thăng trầm khó khăn', phonetic: '/θruː θɪk ənd θɪn/', pos: 'idiom', example: 'True friends stick together through thick and thin.' },
            { front: 'Confide in', back: 'Tâm sự, giãi bày tâm tư thầm kín', phonetic: '/kənˈfaɪd ɪn/', pos: 'phrasal verb', example: 'She is someone I can confide in anytime.' },
            { front: 'Mutual respect', back: 'Sự tôn trọng lẫn nhau', phonetic: '/ˈmjuː.tʃu.əl rɪˈspekt/', pos: 'collocation', example: 'Friendship is built upon mutual respect.' },
            { front: 'Cherish friendships', back: 'Trân trọng các mối quan hệ bạn bè', phonetic: '/ˈtʃer.ɪʃ ˈfrend.ʃɪps/', pos: 'collocation', example: 'I always cherish my lifelong friendships.' },
          ]),
        },
        {
          id: 'p1-u3-texting',
          title: 'Unit 3: Text Messages (Tin Nhắn)',
          subtitle: 'Bài tập bổ trợ Text Messages & Ứng dụng liên lạc',
          icon: '📱',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u3-texting'),
          isUnlocked: isUnlocked('p1-u3-texting'),
          isCompleted: isCompleted('p1-u3-texting'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you prefer texting or phone calls?',
              sampleAnswer: 'Well, it depends on the situation. For quick updates, texting via Zalo or Messenger is definitely more convenient. However, for urgent matters, I prefer making a direct phone call.',
              keyVocab: ['convenient', 'instant messaging', 'urgent matters', 'direct phone call'],
            },
            {
              question: 'How often do you send text messages?',
              sampleAnswer: 'You know, nowadays with the growing popularity of social networking sites such as Facebook and Zalo, it takes me just a few seconds to send a text message, so I almost do it on a daily basis.',
              keyVocab: ['growing popularity', 'social networking sites', 'on a daily basis'],
            },
          ],
          cards: createCards('p1-u3-texting', [
            { front: 'On a daily basis', back: 'Hàng ngày, đều đặn mỗi ngày', phonetic: '/ɑːn ə ˈdeɪ.li ˈbeɪ.sɪs/', pos: 'idiom', example: 'I text my friends on a daily basis.' },
            { front: 'Instant messaging', back: 'Nhắn tin tức thời', phonetic: '/ˈɪn.stənt ˈmes.ɪ.dʒɪŋ/', pos: 'noun', example: 'Instant messaging apps have changed how we connect.' },
            { front: 'Top up', back: 'Nạp thêm tiền vào tài khoản điện thoại', phonetic: '/tɑːp ʌp/', pos: 'phrasal verb', example: 'I need to top up my phone account.' },
            { front: 'Keep in touch', back: 'Giữ liên lạc với nhau', phonetic: '/kiːp ɪn tʌtʃ/', pos: 'idiom', example: 'Texting makes it easy to keep in touch.' },
          ]),
        },
        {
          id: 'p1-chest-1',
          title: 'Rương Thưởng Chặng 1',
          subtitle: 'Bonus Chest +50 XP',
          icon: '🎁',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Bonus',
          type: 'chest',
          stars: getStars('p1-chest-1'),
          isUnlocked: isUnlocked('p1-chest-1'),
          isCompleted: isCompleted('p1-chest-1'),
          xpReward: 50,
          cards: [],
        },
        {
          id: 'p1-u4-travelling',
          title: 'Unit 4: Travelling (Du Lịch & Khám Phá)',
          subtitle: 'Bài tập bổ trợ Travelling & Seasons',
          icon: '✈️',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.5+',
          type: 'lesson',
          stars: getStars('p1-u4-travelling'),
          isUnlocked: isUnlocked('p1-u4-travelling'),
          isCompleted: isCompleted('p1-u4-travelling'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you like travelling?',
              sampleAnswer: 'Definitely yes. Travelling is one of my favorite hobbies. I like to travel to new places to explore various cultures and learn about new things in life. Travelling is also a great way of unwinding after hectic work hours.',
              keyVocab: ['explore various cultures', 'unwind after work', 'hospitality', 'ideal destination'],
            },
            {
              question: 'In which seasons do you prefer to travel?',
              sampleAnswer: 'I guess it would be autumn. This season has little rain, clear skies and temperate conditions. It is really the best season when most tourist destinations are at their peak beauty.',
              keyVocab: ['temperate conditions', 'clear skies', 'peak beauty'],
            },
          ],
          cards: createCards('p1-u4-travelling', [
            { front: 'Temperate conditions', back: 'Thời tiết ôn hòa, dễ chịu', phonetic: '/ˈtem.pɚ.ət kənˈdɪʃ.ənz/', pos: 'collocation', example: 'Autumn offers temperate conditions for sightseeing.' },
            { front: 'Warm hospitality', back: 'Lòng hiếu khách nồng hậu', phonetic: '/wɔːrm ˌhɑː.spɪˈtæl.ə.t̬i/', pos: 'collocation', example: 'Vietnam is renowned for its warm hospitality.' },
            { front: 'Ideal getaway', back: 'Điểm đến nghỉ dưỡng lý tưởng', phonetic: '/aɪˈdiː.əl ˈɡet̬.ə.weɪ/', pos: 'collocation', example: 'Da Lat is an ideal getaway for weekenders.' },
            { front: 'Broaden horizons', back: 'Mở rộng thế giới quan', phonetic: '/ˈbrɑː.dən həˈraɪ.zənz/', pos: 'idiom', example: 'Travelling helps broaden our horizons.' },
          ]),
        },
        {
          id: 'p1-u5-transport',
          title: 'Unit 5: Transportation (Giao Thông)',
          subtitle: 'Bài tập bổ trợ Transportation & Public Transit',
          icon: '🚌',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u5-transport'),
          isUnlocked: isUnlocked('p1-u5-transport'),
          isCompleted: isCompleted('p1-u5-transport'),
          xpReward: 35,
          questions: [
            {
              question: "What's the most popular means of transportation in your hometown?",
              sampleAnswer: 'Well, I can immediately say it is the motorbike. Almost all Vietnamese people have a motorbike because it is not only affordable but also highly convenient for commuting through narrow streets.',
              keyVocab: ['means of transportation', 'affordable', 'highly convenient', 'commute'],
            },
            {
              question: 'Do you think people will drive more in the future?',
              sampleAnswer: 'Maybe no. Environmental pollution is getting worse and vehicle emissions are a major contributor, so I believe people will gradually shift to eco-friendly public transit and electric vehicles.',
              keyVocab: ['vehicle emissions', 'shift to public transit', 'electric vehicles'],
            },
          ],
          cards: createCards('p1-u5-transport', [
            { front: 'Means of transport', back: 'Phương tiện giao thông đi lại', phonetic: '/miːnz əv ˈtræn.spɔːrt/', pos: 'noun', example: 'Bicycles are an eco-friendly means of transport.' },
            { front: 'Vehicle emissions', back: 'Khí thải từ các phương tiện xe cộ', phonetic: '/ˈviː.ə.kəl iˈmɪʃ.ənz/', pos: 'collocation', example: 'Electric buses help cut vehicle emissions.' },
            { front: 'Traffic congestion', back: 'Tình trạng ùn tắc giao thông', phonetic: '/ˈtræf.ɪk kənˈdʒes.tʃən/', pos: 'collocation', example: 'Commuting by metro avoids traffic congestion.' },
            { front: 'Cost-effective', back: 'Hiệu quả về mặt chi phí, tiết kiệm tiền', phonetic: '/ˌkɑːst.ɪˈfek.tɪv/', pos: 'adj', example: 'Public transit is very cost-effective.' },
          ]),
        },
        {
          id: 'p1-u6-emails',
          title: 'Unit 6: Letters & Emails (Thư Từ & Email)',
          subtitle: 'Bài tập bổ trợ Letters vs Emails',
          icon: '✉️',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u6-emails'),
          isUnlocked: isUnlocked('p1-u6-emails'),
          isCompleted: isCompleted('p1-u6-emails'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you prefer typing emails or handwriting letters?',
              sampleAnswer: 'Well, I definitely prefer typing emails. Using a computer saves immense time, allows instant communication across borders, and lets me edit errors effortlessly.',
              keyVocab: ['instant communication', 'edit errors effortlessly', 'formal correspondence'],
            },
          ],
          cards: createCards('p1-u6-emails', [
            { front: 'Formal correspondence', back: 'Thư từ trao đổi công việc trang trọng', phonetic: '/ˈfɔːr.məl ˌkɔːr.əˈspɑːn.dəns/', pos: 'collocation', example: 'Email is essential for formal correspondence.' },
            { front: 'Handwritten letter', back: 'Thư viết tay chứa chan tình cảm', phonetic: '/ˌhændˈrɪt.ən ˈlet̬.ɚ/', pos: 'noun', example: 'A handwritten letter carries personal warmth.' },
            { front: 'Exchange ideas', back: 'Trao đổi ý kiến và kế hoạch', phonetic: '/ɪksˈtʃeɪndʒ aɪˈdiː.əz/', pos: 'phrase', example: 'We email daily to exchange ideas.' },
          ]),
        },
        {
          id: 'p1-u7-swimming',
          title: 'Unit 7: Swimming (Bơi Lội & Kỹ Năng Sống)',
          subtitle: 'Bài tập bổ trợ Swimming & Life Skills',
          icon: '🏊',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u7-swimming'),
          isUnlocked: isUnlocked('p1-u7-swimming'),
          isCompleted: isCompleted('p1-u7-swimming'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you think everyone should learn to swim?',
              sampleAnswer: 'Definitely yes. Swimming is a crucial life-saving skill that everyone should acquire. Besides, it is an excellent full-body workout that strengthens cardiovascular health and relieves stress.',
              keyVocab: ['life-saving skill', 'acquire', 'full-body workout', 'cardiovascular health'],
            },
          ],
          cards: createCards('p1-u7-swimming', [
            { front: 'Life-saving skill', back: 'Kỹ năng sinh tồn, cứu sống bản thân', phonetic: '/ˈlaɪfˌseɪ.vɪŋ skɪl/', pos: 'collocation', example: 'Swimming is a vital life-saving skill.' },
            { front: 'Full-body workout', back: 'Bài tập rèn luyện toàn diện các nhóm cơ', phonetic: '/fʊl ˈbɑː.di ˈwɝːk.aʊt/', pos: 'collocation', example: 'Swimming provides an intense full-body workout.' },
            { front: 'Relieve stress', back: 'Giải tỏa áp lực, căng thẳng', phonetic: '/rɪˈliːv stres/', pos: 'collocation', example: 'Diving into cool water helps relieve stress.' },
          ]),
        },
        {
          id: 'p1-u8-snacks',
          title: 'Unit 8: Snacks (Đồ Ăn Vặt & Dinh Dưỡng)',
          subtitle: 'Bài tập bổ trợ Snacks & Healthy Eating',
          icon: '🍿',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.0+',
          type: 'lesson',
          stars: getStars('p1-u8-snacks'),
          isUnlocked: isUnlocked('p1-u8-snacks'),
          isCompleted: isCompleted('p1-u8-snacks'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you think eating snacks is healthy?',
              sampleAnswer: 'It depends on the choice of snacks. Processed junk food loaded with refined sugars and saturated fats is certainly detrimental to our health. However, wholesome snacks like almonds, walnuts, and fresh fruits provide sustained energy.',
              keyVocab: ['detrimental to health', 'wholesome snacks', 'sustained energy', 'processed junk food'],
            },
          ],
          cards: createCards('p1-u8-snacks', [
            { front: 'Detrimental to health', back: 'Có hại, gây tổn hại cho sức khỏe', phonetic: '/ˌdet.rəˈmen.t̬əl tuː helθ/', pos: 'collocation', example: 'Excessive junk food is detrimental to health.' },
            { front: 'Wholesome nutrition', back: 'Dinh dưỡng lành mạnh, nguyên chất', phonetic: '/ˈhoʊl.səm nuːˈtrɪʃ.ən/', pos: 'collocation', example: 'Nuts and fruits offer wholesome nutrition.' },
            { front: 'Satisfy cravings', back: 'Thỏa mãn cơn thèm ăn', phonetic: '/ˈsæt̬.ɪs.faɪ ˈkreɪ.vɪŋz/', pos: 'collocation', example: 'A cup of yogurt helps satisfy cravings.' },
          ]),
        },
        {
          id: 'p1-u9-photo',
          title: 'Unit 9: Photography (Nhiếp Ảnh)',
          subtitle: 'Bài tập bổ trợ Photography & Memorable Shots',
          icon: '📸',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 7.5+',
          type: 'lesson',
          stars: getStars('p1-u9-photo'),
          isUnlocked: isUnlocked('p1-u9-photo'),
          isCompleted: isCompleted('p1-u9-photo'),
          xpReward: 35,
          questions: [
            {
              question: 'Do you like to take photographs?',
              sampleAnswer: 'Yes, absolutely. Photography is a wonderful medium to capture fleeting moments and preserve meaningful milestones in life. Whenever I travel, taking pictures lets me relive those golden memories.',
              keyVocab: ['capture fleeting moments', 'preserve meaningful milestones', 'relive golden memories'],
            },
          ],
          cards: createCards('p1-u9-photo', [
            { front: 'Capture fleeting moments', back: 'Lưu giữ những khoảnh khắc thoáng qua', phonetic: '/ˈkæp.tʃɚ ˈfliː.t̬ɪŋ ˈmoʊ.mənts/', pos: 'collocation', example: 'Photos capture fleeting moments of joy.' },
            { front: 'Preserve milestones', back: 'Gìn giữ những dấu mốc quan trọng trong đời', phonetic: '/prɪˈzɝːv ˈmaɪl.stoʊnz/', pos: 'collocation', example: 'Graduation photos preserve milestones.' },
            { front: 'Photogenic', back: 'Ăn ảnh, chụp ảnh trông rất đẹp', phonetic: '/ˌfoʊ.t̬oʊˈdʒen.ɪk/', pos: 'adj', example: 'The coastal cliffs are exceptionally photogenic.' },
          ]),
        },
        {
          id: 'p1-u10-help-boss',
          title: 'Unit 10: Help & Part 1 Boss Exam',
          subtitle: 'Bài tập bổ trợ Help & Thi Thử Tổng Hợp Part 1',
          icon: '🏆',
          chapterId: 'fspeaking-part-1',
          part: 'Part 1',
          targetBand: 'Band 8.0+',
          type: 'boss',
          stars: getStars('p1-u10-help-boss'),
          isUnlocked: isUnlocked('p1-u10-help-boss'),
          isCompleted: isCompleted('p1-u10-help-boss'),
          xpReward: 80,
          questions: [
            {
              question: 'Do you like helping others?',
              sampleAnswer: 'Certainly. Lending a helping hand to those in need brings an immense sense of joy and fulfillment. A supportive community makes the world a much warmer place.',
              keyVocab: ['lend a helping hand', 'in need', 'immense fulfillment'],
            },
          ],
          cards: createCards('p1-u10-help-boss', [
            { front: 'Lend a helping hand', back: 'Chung tay giúp đỡ người gặp khó khăn', phonetic: '/lend ə ˈhel.pɪŋ hænd/', pos: 'idiom', example: 'We should always lend a helping hand to neighbors.' },
            { front: 'Altruistic spirit', back: 'Tinh thần vị tha, trượng nghĩa', phonetic: '/ˌæl.truˈɪs.tɪk ˈspɪr.ɪt/', pos: 'collocation', example: 'Volunteers are driven by an altruistic spirit.' },
            { front: 'Fluency Mastery', back: 'Sự thuần thục trôi chảy tuyệt đối', phonetic: '/ˈfluː.ən.si ˈmæs.tɚ.i/', pos: 'noun', example: 'You have mastered all 10 Units of Part 1!' },
          ]),
        },
      ],
    },
    {
      id: 'fspeaking-part-2',
      title: 'CHAPTER 2. IELTS SPEAKING PART 2 (THE LONG TURN)',
      subtitle: 'Chiến thuật Idea Extension 4 Cuối - 3 Đầu & Bộ Đề Forecast Cue Cards',
      part: 'Part 2',
      band: 'Band 7.5 - 8.5',
      color: '#8B5CF6',
      nodes: [
        {
          id: 'p2-u1-strategy',
          title: 'Chiến Thuật 4 Cuối - 3 Đầu & Mở Rộng Ý',
          subtitle: 'Idea Extension: Quá khứ, Nguyên nhân, Cảm xúc & Tương lai',
          icon: '💡',
          chapterId: 'fspeaking-part-2',
          part: 'Part 2',
          targetBand: 'Band 8.0+',
          type: 'lesson',
          stars: getStars('p2-u1-strategy'),
          isUnlocked: isUnlocked('p2-u1-strategy'),
          isCompleted: isCompleted('p2-u1-strategy'),
          xpReward: 40,
          cueCardPrompt: 'Kỹ thuật mở rộng bài nói Part 2 không lo cạn ý tưởng: Áp dụng 4 Chiến thuật Cuối (Nguyên nhân, Diễn biến, Cảm xúc, Bài học) và 3 Chiến thuật Đầu (Bối cảnh, Thời gian, Nhân vật).',
          cards: createCards('p2-u1-strategy', [
            { front: 'Chronological order', back: 'Trình tự thời gian mạch lạc từ đầu đến cuối', phonetic: '/ˌkrɑː.nəˈlɑː.dʒɪ.kəl ˈɔːr.dɚ/', pos: 'collocation', example: 'Structure your Part 2 story in chronological order.' },
            { front: 'Set the scene', back: 'Thiết lập bối cảnh không gian thời gian mở đầu câu chuyện', phonetic: '/set ðə siːn/', pos: 'idiom', example: 'Start by setting the scene vividly.' },
            { front: 'Pivotal turning point', back: 'Điểm nút thắt chuyển biến cao trào của câu chuyện', phonetic: '/ˈpɪv.ə.t̬əl ˈtɝː.nɪŋ pɔɪnt/', pos: 'collocation', example: 'That unexpected moment was the pivotal turning point.' },
          ]),
        },
        {
          id: 'p2-u2-journey',
          title: 'Cue Card: Describe An Unforgettable Journey',
          subtitle: 'Miêu tả chuyến đi / kỳ nghỉ đáng nhớ nhất cuộc đời',
          icon: '🗺️',
          chapterId: 'fspeaking-part-2',
          part: 'Part 2',
          targetBand: 'Band 8.5+',
          type: 'lesson',
          stars: getStars('p2-u2-journey'),
          isUnlocked: isUnlocked('p2-u2-journey'),
          isCompleted: isCompleted('p2-u2-journey'),
          xpReward: 45,
          cueCardPrompt: 'Describe an unforgettable journey you went on. You should say: where you went, who you traveled with, what you did during the trip, and explain why this journey left a lasting impression on you.',
          cards: createCards('p2-u2-journey', [
            { front: 'Off the beaten track', back: 'Địa điểm hoang sơ, ít dấu chân du khách', phonetic: '/ɔːf ðə ˈbiː.tən træk/', pos: 'idiom', example: 'We discovered a secluded beach off the beaten track.' },
            { front: 'Picturesque landscape', back: 'Phong cảnh đẹp như một bức tranh nghệ thuật', phonetic: '/ˌpɪk.tʃərˈesk ˈlænd.skeɪp/', pos: 'collocation', example: 'The misty valleys formed a picturesque landscape.' },
            { front: 'Indelible impression', back: 'Dấu ấn sâu đậm khắc ghi mãi trong tâm trí', phonetic: '/ɪnˈdel.ə.bəl ɪmˈpreʃ.ən/', pos: 'collocation', example: 'The warmth of the villagers left an indelible impression.' },
          ]),
        },
        {
          id: 'p2-u3-person',
          title: 'Cue Card: Describe A Role Model / Person You Admire',
          subtitle: 'Miêu tả một người truyền cảm hứng mạnh mẽ cho bạn',
          icon: '🌟',
          chapterId: 'fspeaking-part-2',
          part: 'Part 2',
          targetBand: 'Band 8.5+',
          type: 'lesson',
          stars: getStars('p2-u3-person'),
          isUnlocked: isUnlocked('p2-u3-person'),
          isCompleted: isCompleted('p2-u3-person'),
          xpReward: 45,
          cueCardPrompt: 'Describe a person who has inspired you. You should say: who this person is, how you know them, what special traits they possess, and explain why you look up to them so deeply.',
          cards: createCards('p2-u3-person', [
            { front: 'Unwavering determination', back: 'Ý chí kiên định, không bao giờ bỏ cuộc', phonetic: '/ʌnˈweɪ.vɚ.ɪŋ dɪˌtɝː.mɪˈneɪ.ʃən/', pos: 'collocation', example: 'Her unwavering determination inspired everyone.' },
            { front: 'Down-to-earth demeanor', back: 'Tính cách khiêm nhường, gần gũi và chân thành', phonetic: '/ˌdaʊn.tuːˈɝːθ dɪˈmiː.nɚ/', pos: 'collocation', example: 'Despite massive success, he maintains a down-to-earth demeanor.' },
            { front: 'Beacon of hope', back: 'Ngọn hải đăng soi sáng niềm tin và hy vọng', phonetic: '/ˈbiː.kən əv hoʊp/', pos: 'metaphor', example: 'She served as a beacon of hope during dark times.' },
          ]),
        },
        {
          id: 'p2-u4-boss',
          title: 'Grand Part 2 Cue Card Simulation Boss',
          subtitle: 'Thi thử 2 Phút độc thoại Part 2 Chấm Điểm AI',
          icon: '👑',
          chapterId: 'fspeaking-part-2',
          part: 'Part 2',
          targetBand: 'Band 8.5 - 9.0',
          type: 'boss',
          stars: getStars('p2-u4-boss'),
          isUnlocked: isUnlocked('p2-u4-boss'),
          isCompleted: isCompleted('p2-u4-boss'),
          xpReward: 90,
          cards: createCards('p2-u4-boss', [
            { front: 'Impeccable coherence', back: 'Sự liên kết mạch lạc hoàn hảo giữa các luận điểm', phonetic: '/ɪmˈpek.ə.bəl koʊˈhɪr.əns/', pos: 'collocation', example: 'Her Part 2 speech demonstrated impeccable coherence.' },
            { front: 'Eloquent storytelling', back: 'Nghệ thuật kể chuyện truyền cảm và cuốn hút', phonetic: '/ˈel.ə.kwənt ˈstɔːr.iˌtel.ɪŋ/', pos: 'collocation', example: 'Eloquent storytelling will secure your Band 8.5+.' },
          ]),
        },
      ],
    },
    {
      id: 'fspeaking-part-3',
      title: 'CHAPTER 3. IELTS SPEAKING PART 3 (IN-DEPTH DISCUSSION)',
      subtitle: 'Công Thức Reason & Example, Đánh Giá 2 Luồng Quan Điểm & Dự Đoán Tương Lai',
      part: 'Part 3',
      band: 'Band 8.0 - 9.0',
      color: '#10B981',
      nodes: [
        {
          id: 'p3-u1-formula',
          title: 'Công Thức Vàng: Reason & Example',
          subtitle: 'Kỹ thuật trả lời mọi câu hỏi Part 3 theo Reason + Example',
          icon: '🧩',
          chapterId: 'fspeaking-part-3',
          part: 'Part 3',
          targetBand: 'Band 8.0+',
          type: 'lesson',
          stars: getStars('p3-u1-formula'),
          isUnlocked: isUnlocked('p3-u1-formula'),
          isCompleted: isCompleted('p3-u1-formula'),
          xpReward: 45,
          questions: [
            {
              question: 'Do you think children should be made to wear school uniforms?',
              sampleAnswer: 'I believe school uniforms should be compulsory. The primary reason is that uniforms bridge the socio-economic gap among pupils, preventing peer pressure related to fashion. Take many Asian countries for example, where uniforms foster unity and discipline in classrooms.',
              keyVocab: ['bridge socio-economic gaps', 'peer pressure', 'foster unity and discipline'],
              tips: 'Áp dụng công thức vàng: Quan điểm rõ ràng + Nêu lý do then chốt + Đưa ra ví dụ minh họa cụ thể.',
            },
          ],
          cards: createCards('p3-u1-formula', [
            { front: 'Bridge the gap', back: 'Xóa nhòa khoảng cách, thu hẹp sự chênh lệch', phonetic: '/brɪdʒ ðə ɡæp/', pos: 'idiom', example: 'Education helps bridge the socio-economic gap.' },
            { front: 'Foster unity', back: 'Thúc đẩy sự đoàn kết và hòa đồng', phonetic: '/ˈfɑː.stɚ ˈjuː.nə.t̬i/', pos: 'collocation', example: 'Team activities foster unity among colleagues.' },
            { front: 'Peer pressure', back: 'Áp lực đồng trang lứa', phonetic: '/ˈpɪr ˌpreʃ.ɚ/', pos: 'noun', example: 'Uniforms alleviate peer pressure regarding clothing.' },
          ]),
        },
        {
          id: 'p3-u2-distance',
          title: 'Kỹ Thuật "Distance Yourself" & Đánh Giá 2 Chiều',
          subtitle: 'Tránh dùng "I think", nâng tầm câu trả lời bằng góc nhìn xã hội',
          icon: '🌐',
          chapterId: 'fspeaking-part-3',
          part: 'Part 3',
          targetBand: 'Band 8.5+',
          type: 'lesson',
          stars: getStars('p3-u2-distance'),
          isUnlocked: isUnlocked('p3-u2-distance'),
          isCompleted: isCompleted('p3-u2-distance'),
          xpReward: 45,
          questions: [
            {
              question: 'Do people need professional photographers for important events?',
              sampleAnswer: "It is widely acknowledged that on momentous occasions such as weddings or graduation ceremonies, hiring a seasoned photographer is paramount to capture high-definition memories. However, for casual gatherings, smartphone cameras are more than adequate.",
              keyVocab: ['widely acknowledged', 'momentous occasions', 'seasoned photographer', 'more than adequate'],
              tips: 'Dùng "It is widely acknowledged that..." thay cho "In my experience, I think..."',
            },
          ],
          cards: createCards('p3-u2-distance', [
            { front: 'Widely acknowledged', back: 'Được công nhận và thừa nhận rộng rãi', phonetic: '/ˈwaɪd.li əkˈnɑː.lɪdʒd/', pos: 'collocation', example: 'It is widely acknowledged that climate change is urgent.' },
            { front: 'Momentous occasion', back: 'Sự kiện trọng đại, có ý nghĩa lịch sử', phonetic: '/moʊˈmen.t̬əs əˈkeɪ.ʒən/', pos: 'collocation', example: 'Graduation is a momentous occasion for students.' },
            { front: 'Seasoned professional', back: 'Chuyên gia dày dặn kinh nghiệm', phonetic: '/ˈsiː.zənd prəˈfeʃ.ən.əl/', pos: 'collocation', example: 'Always consult a seasoned professional.' },
          ]),
        },
        {
          id: 'p3-u3-speculation',
          title: 'Kỹ Thuật Suy Luận Tương Lai (Speculating Future)',
          subtitle: 'Dự đoán tác động của công nghệ & biến đổi xã hội',
          icon: '🔮',
          chapterId: 'fspeaking-part-3',
          part: 'Part 3',
          targetBand: 'Band 8.5 - 9.0',
          type: 'lesson',
          stars: getStars('p3-u3-speculation'),
          isUnlocked: isUnlocked('p3-u3-speculation'),
          isCompleted: isCompleted('p3-u3-speculation'),
          xpReward: 50,
          questions: [
            {
              question: 'How do you feel about modern biological technology and AI in the future?',
              sampleAnswer: 'There is a high likelihood that biotechnology and artificial intelligence will eradicate genetic disorders. Nonetheless, without stringent ethical frameworks, these breakthroughs could trigger unprecedented ethical dilemmas regarding human cloning.',
              keyVocab: ['high likelihood', 'eradicate genetic disorders', 'stringent ethical frameworks', 'ethical dilemmas'],
            },
          ],
          cards: createCards('p3-u3-speculation', [
            { front: 'High likelihood', back: 'Khả năng cao sẽ xảy ra trong tương lai', phonetic: '/haɪ ˈlaɪ.kli.hʊd/', pos: 'collocation', example: 'There is a high likelihood of automated transport.' },
            { front: 'Ethical dilemma', back: 'Thế tiến thoái lưỡng nan về mặt đạo đức', phonetic: '/ˈeθ.ɪ.kəl dɪˈlem.ə/', pos: 'collocation', example: 'Gene editing creates complex ethical dilemmas.' },
            { front: 'Stringent frameworks', back: 'Hệ thống quy chuẩn pháp lý và đạo đức chặt chẽ', phonetic: '/ˈstrɪn.dʒənt ˈfreɪm.wɝːks/', pos: 'collocation', example: 'AI requires stringent regulatory frameworks.' },
          ]),
        },
        {
          id: 'p3-u4-master-boss',
          title: 'IELTS Speaking Grandmaster Band 9.0 Finale',
          subtitle: 'Kỳ thi Tốt nghiệp Toàn diện Khóa Học F:\\Speaking',
          icon: '🔥',
          chapterId: 'fspeaking-part-3',
          part: 'Part 3',
          targetBand: 'Band 9.0 Master',
          type: 'boss',
          stars: getStars('p3-u4-master-boss'),
          isUnlocked: isUnlocked('p3-u4-master-boss'),
          isCompleted: isCompleted('p3-u4-master-boss'),
          xpReward: 100,
          cards: createCards('p3-u4-master-boss', [
            { front: 'Profound insight', back: 'Nhận định uyên bác, thấu đáo và sâu sắc', phonetic: '/prəˈfaʊnd ˈɪn.saɪt/', pos: 'collocation', example: 'The candidate delivered profound insights.' },
            { front: 'Flawless articulation', back: 'Khả năng diễn ngôn hoàn mỹ, không một tì vết', phonetic: '/ˈflɔː.ləs ɑːrˌtɪk.jəˈleɪ.ʃən/', pos: 'collocation', example: 'Flawless articulation defines a Band 9.0 speaker.' },
            { front: 'Master of IELTS Speaking', back: 'Bậc thầy hoàn thành xuất sắc toàn bộ khóa học', phonetic: '/ˈmæs.tɚ əv ˈaɪ.elts ˈspiː.kɪŋ/', pos: 'noun', example: 'Congratulations! You have mastered the entire curriculum.' },
          ]),
        },
      ],
    },
  ];
}

// Preset 2: Business Speaking
function getBusinessChapters(): RoadmapChapter[] {
  const progress = getRoadmapProgress();
  const isUnlocked = (id: string) => progress.unlockedNodeIds.includes(id) || id === 'biz-p1-intro';
  const isCompleted = (id: string) => progress.completedNodeIds.includes(id);
  const getStars = (id: string) => progress.nodeStars[id] || 0;

  return [
    {
      id: 'biz-part-1',
      title: 'CHẶNG 1: GIAO TIẾP & HỘI HỌP CÔNG SỞ (BUSINESS TALK)',
      subtitle: 'Office Small Talk, Pitching & Meetings',
      part: 'Part 1',
      band: 'C1 Business English',
      color: '#3B82F6',
      nodes: [
        {
          id: 'biz-p1-intro',
          title: 'Pitching & Introductions',
          subtitle: 'Giới thiệu bản thân & Trình bày ý tưởng',
          icon: '💼',
          chapterId: 'biz-part-1',
          part: 'Part 1',
          targetBand: 'C1 Fluent',
          type: 'lesson',
          stars: getStars('biz-p1-intro'),
          isUnlocked: true,
          isCompleted: isCompleted('biz-p1-intro'),
          xpReward: 35,
          questions: [
            {
              question: 'How do you pitch an innovative product to international stakeholders?',
              sampleAnswer: 'I focus on presenting a compelling value proposition backed by empirical data and a clear return on investment.',
              keyVocab: ['value proposition', 'empirical data', 'return on investment'],
            },
          ],
          cards: createCards('biz-p1-intro', [
            { front: 'Value proposition', back: 'Tuyên bố giá trị khác biệt của sản phẩm', phonetic: '/ˈvæl.juː ˌprɑːp.əˈzɪʃ.ən/', pos: 'collocation', example: 'Our value proposition highlights speed.' },
            { front: 'Return on investment', back: 'Tỷ suất hoàn vốn đầu tư (ROI)', phonetic: '/rɪˈtɝːn ɑːn ɪnˈvest.mənt/', pos: 'collocation', example: 'Investors expect a healthy return on investment.' },
          ]),
        },
      ],
    },
  ];
}

// Preset 3: Daily Travel
function getDailyTravelChapters(): RoadmapChapter[] {
  const progress = getRoadmapProgress();
  const isUnlocked = (id: string) => progress.unlockedNodeIds.includes(id) || id === 'daily-p1-travel';
  const isCompleted = (id: string) => progress.completedNodeIds.includes(id);
  const getStars = (id: string) => progress.nodeStars[id] || 0;

  return [
    {
      id: 'daily-part-1',
      title: 'CHẶNG 1: DU LỊCH & ĐỜI SỐNG THỰC TẾ (DAILY & TRAVEL)',
      subtitle: 'Living Abroad, Airport, Hotel & Dining',
      part: 'Part 1',
      band: 'B2 Everyday Mastery',
      color: '#10B981',
      nodes: [
        {
          id: 'daily-p1-travel',
          title: 'Airport & Customs Check',
          subtitle: 'Thủ tục sân bay & Nhập cảnh',
          icon: '✈️',
          chapterId: 'daily-part-1',
          part: 'Part 1',
          targetBand: 'B2 Fluent',
          type: 'lesson',
          stars: getStars('daily-p1-travel'),
          isUnlocked: true,
          isCompleted: isCompleted('daily-p1-travel'),
          xpReward: 35,
          questions: [
            {
              question: 'How do you handle immigration inquiries confidently at the airport?',
              sampleAnswer: 'I clearly state the purpose of my visit, present my itinerary and accommodation details with a polite attitude.',
              keyVocab: ['purpose of visit', 'itinerary', 'accommodation details'],
            },
          ],
          cards: createCards('daily-p1-travel', [
            { front: 'Boarding gate', back: 'Cổng lên máy bay', phonetic: '/ˈbɔːr.dɪŋ ɡeɪt/', pos: 'noun', example: 'Please proceed to boarding gate 14.' },
          ]),
        },
      ],
    },
  ];
}

export function generateAISpeakingRoadmap(
  topicName: string,
  targetBand: string = 'Band 7.5+'
): SpeakingRoadmapProfile {
  const customId = `custom-roadmap-${Date.now()}`;
  const cleanTitle = topicName.trim() || 'Lộ Trình Luyện Nói Cá Nhân Hóa';

  const progress = getRoadmapProgress();
  const isUnlocked = (id: string) => progress.unlockedNodeIds.includes(id) || id.endsWith('-p1-1');
  const isCompleted = (id: string) => progress.completedNodeIds.includes(id);
  const getStars = (id: string) => progress.nodeStars[id] || 0;

  const chapters: RoadmapChapter[] = [
    {
      id: `${customId}-part1`,
      title: `CHẶNG 1: KHỞI ĐỘNG & NỀN TẢNG (${cleanTitle})`,
      subtitle: 'Part 1: Key Vocabulary & Essential Speaking Patterns',
      part: 'Part 1',
      band: targetBand,
      color: '#3B82F6',
      nodes: [
        {
          id: `${customId}-p1-1`,
          title: `Thuật Ngữ Cốt Lõi: ${cleanTitle}`,
          subtitle: 'Core Foundation Vocabulary',
          icon: '⚡',
          chapterId: `${customId}-part1`,
          part: 'Part 1',
          targetBand,
          type: 'lesson',
          stars: getStars(`${customId}-p1-1`),
          isUnlocked: true,
          isCompleted: isCompleted(`${customId}-p1-1`),
          xpReward: 35,
          questions: [
            {
              question: `What makes ${cleanTitle} so important in your life or career?`,
              sampleAnswer: `From my perspective, ${cleanTitle} plays an indispensable role because it provides immense opportunities for intellectual growth and professional achievement.`,
              keyVocab: ['indispensable role', 'immense opportunities', 'intellectual growth'],
            },
          ],
          cards: createCards(`${customId}-p1-1`, [
            { front: 'Indispensable', back: 'Không thể thiếu, vô cùng thiết yếu', phonetic: '/ˌɪn.dɪˈspen.sə.bəl/', pos: 'adj', example: 'Practice is indispensable for fluency.' },
            { front: 'Immense opportunity', back: 'Cơ hội to lớn, rộng mở', phonetic: '/ɪˈmens ˌɑː.pɚˈtuː.nə.t̬i/', pos: 'collocation', example: 'This field offers immense opportunities.' },
            { front: 'Intellectual growth', back: 'Sự phát triển về mặt trí tuệ và tư duy', phonetic: '/ˌɪn.t̬əlˈek.tʃu.əl ɡroʊθ/', pos: 'collocation', example: 'Reading fosters intellectual growth.' },
          ]),
        },
        {
          id: `${customId}-p1-boss`,
          title: `Thử Thách Chặng 1: ${cleanTitle}`,
          subtitle: 'Checkpoint Speaking Boss',
          icon: '🏆',
          chapterId: `${customId}-part1`,
          part: 'Part 1',
          targetBand,
          type: 'boss',
          stars: getStars(`${customId}-p1-boss`),
          isUnlocked: isUnlocked(`${customId}-p1-boss`),
          isCompleted: isCompleted(`${customId}-p1-boss`),
          xpReward: 70,
          cards: createCards(`${customId}-p1-boss`, [
            { front: 'Confidence booster', back: 'Yếu tố giúp gia tăng sự tự tin', phonetic: '/ˈkɑːn.fə.dəns ˈbuː.stɚ/', pos: 'collocation', example: 'Every practice session is a confidence booster.' },
          ]),
        },
      ],
    },
    {
      id: `${customId}-part2`,
      title: `CHẶNG 2: THUYẾT TRÌNH & ĐỘC THOẠI 2 PHÚT`,
      subtitle: 'Part 2: Long Turn Mastery & Storytelling',
      part: 'Part 2',
      band: targetBand,
      color: '#8B5CF6',
      nodes: [
        {
          id: `${customId}-p2-1`,
          title: 'Thuyết Trình Chuyên Sâu 2 Phút',
          subtitle: '2-Minute Presentation',
          icon: '🎙️',
          chapterId: `${customId}-part2`,
          part: 'Part 2',
          targetBand,
          type: 'lesson',
          stars: getStars(`${customId}-p2-1`),
          isUnlocked: isUnlocked(`${customId}-p2-1`),
          isCompleted: isCompleted(`${customId}-p2-1`),
          xpReward: 40,
          cueCardPrompt: `Describe a significant achievement or project related to ${cleanTitle}. You should explain: what the project was, how you prepared for it, what challenges arose, and why this milestone is so meaningful to you.`,
          cards: createCards(`${customId}-p2-1`, [
            { front: 'Pivotal moment', back: 'Khoảnh khắc mang tính bước ngoặt', phonetic: '/ˈpɪv.ə.t̬əl ˈmoʊ.mənt/', pos: 'collocation', example: 'It was a pivotal moment in my career.' },
            { front: 'Profound impact', back: 'Tác động sâu sắc và mạnh mẽ', phonetic: '/prəˈfaʊnd ˈɪm.pækt/', pos: 'collocation', example: 'This experience had a profound impact on me.' },
          ]),
        },
        {
          id: `${customId}-p2-boss`,
          title: 'Đỉnh Cao Thuyết Trình Part 2',
          subtitle: 'Grand Long-Turn Boss Challenge',
          icon: '👑',
          chapterId: `${customId}-part2`,
          part: 'Part 2',
          targetBand,
          type: 'boss',
          stars: getStars(`${customId}-p2-boss`),
          isUnlocked: isUnlocked(`${customId}-p2-boss`),
          isCompleted: isCompleted(`${customId}-p2-boss`),
          xpReward: 80,
          cards: createCards(`${customId}-p2-boss`, [
            { front: 'Masterful delivery', back: 'Phong thái diễn thuyết bậc thầy', phonetic: '/ˈmæs.tɚ.fəl dɪˈlɪv.ɚ.i/', pos: 'collocation', example: 'A masterful delivery captivates the audience.' },
          ]),
        },
      ],
    },
    {
      id: `${customId}-part3`,
      title: `CHẶNG 3: TRANH LUẬN & PHẢN BIỆN TƯ DUY`,
      subtitle: 'Part 3: Critical Thinking & Discussion',
      part: 'Part 3',
      band: targetBand,
      color: '#10B981',
      nodes: [
        {
          id: `${customId}-p3-1`,
          title: `Tư Duy Phản Biện: ${cleanTitle}`,
          subtitle: 'Critical Discussion & Analysis',
          icon: '🧠',
          chapterId: `${customId}-part3`,
          part: 'Part 3',
          targetBand,
          type: 'lesson',
          stars: getStars(`${customId}-p3-1`),
          isUnlocked: isUnlocked(`${customId}-p3-1`),
          isCompleted: isCompleted(`${customId}-p3-1`),
          xpReward: 45,
          questions: [
            {
              question: `How will ${cleanTitle} evolve in the upcoming decade?`,
              sampleAnswer: `I firmly believe that advancements in technology and globalization will completely transform ${cleanTitle}, opening up unprecedented possibilities.`,
              keyVocab: ['firmly believe', 'unprecedented possibilities', 'globalization'],
            },
          ],
          cards: createCards(`${customId}-p3-1`, [
            { front: 'Unprecedented possibility', back: 'Khả năng chưa từng có trong lịch sử', phonetic: '/ʌnˈpres.ə.den.t̬ɪd ˌpɑː.səˈbɪl.ə.t̬i/', pos: 'collocation', example: 'AI brings unprecedented possibilities.' },
            { front: 'Nuanced argument', back: 'Lập luận sắc bén, đa chiều và tinh tế', phonetic: '/ˈnuː.ɑːnst ˈɑːrɡ.jə.mənt/', pos: 'collocation', example: 'Present a nuanced argument with clear evidence.' },
          ]),
        },
        {
          id: `${customId}-p3-boss`,
          title: 'Tốt Nghiệp Lộ Trình Toàn Diện',
          subtitle: 'Final Mastery Grand Finale',
          icon: '🔥',
          chapterId: `${customId}-part3`,
          part: 'Part 3',
          targetBand,
          type: 'boss',
          stars: getStars(`${customId}-p3-boss`),
          isUnlocked: isUnlocked(`${customId}-p3-boss`),
          isCompleted: isCompleted(`${customId}-p3-boss`),
          xpReward: 100,
          cards: createCards(`${customId}-p3-boss`, [
            { front: 'Eloquent speaker', back: 'Người diễn thuyết lưu loát, truyền cảm hứng', phonetic: '/ˈel.ə.kwənt ˈspiː.kɚ/', pos: 'collocation', example: 'You have become an eloquent speaker.' },
            { front: 'Ultimate Triumph', back: 'Chiến thắng vinh quang tột đỉnh', phonetic: '/ˈʌl.tə.mət ˈtraɪ.əmf/', pos: 'noun', example: 'Celebrate your ultimate triumph!' },
          ]),
        },
      ],
    },
  ];

  const profile: SpeakingRoadmapProfile = {
    id: customId,
    name: cleanTitle,
    description: `Lộ trình luyện nói chuyên sâu về chủ đề ${cleanTitle} do bạn thiết kế, bao gồm Part 1, Part 2 Cue Card và Part 3 thảo luận phản biện.`,
    category: 'custom',
    icon: '🎯',
    targetBand,
    chapters,
    isCustom: true,
  };

  saveCustomRoadmapProfile(profile);
  setActiveRoadmapProfileId(customId);
  return profile;
}

