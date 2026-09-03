// AI English Tutor & Conversational Partner Engine with Gojo Satoru AI
// Integrated with all 10 Part 1 Units, Part 2 Cue Cards, and Part 3 In-Depth Discussions from F:\Speaking

import { AIChatMessage, ConversationScenario, AnswerEvaluation } from '../types';
import { storage } from './storage';

export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  // --- CHAPTER 0: GEMINI AI FREE CONVERSATION & Q&A ---
  {
    id: 'gemini-free-chat',
    title: 'Chat Tự Do & Hỏi Đáp Cùng Gemini AI 💎',
    topic: 'Gemini AI Personal English Tutor',
    description: 'Hỏi đáp ngữ pháp, tra cứu từ vựng, luyện giao tiếp tự do không giới hạn với trí tuệ nhân tạo Google Gemini.',
    icon: '🤖',
    level: 'Mọi Trình Độ',
    category: 'daily' as any,
    initialAIMessage: "Hello! I am your personal Gemini AI English Tutor. You can ask me any questions about English, discuss any topic, or practice conversation with me. What would you like to talk about today?",
    initialTranslation: "Xin chào! Tôi là Trợ lý Gia sư Tiếng Anh Gemini AI của bạn. Bạn có thể hỏi bất kỳ câu hỏi nào về tiếng Anh, thảo luận về mọi chủ đề hoặc luyện đàm thoại cùng tôi. Hôm nay bạn muốn trò chuyện về điều gì?",
    suggestedPrompts: [
      "Can you help me practice daily English conversation?",
      "How can I improve my English speaking fluency and pronunciation?",
      "Could you explain the difference between 'effective' and 'efficient'?",
    ],
    keyVocab: ['conversational partner', 'fluency', 'natural expression', 'expand vocabulary'],
  },

  // --- CHAPTER 1: IELTS SPEAKING PART 1 (F:\Speaking 10 UNITS) ---
  {
    id: 'ielts-p1-u1-intro',
    title: 'Unit 1: Giới Thiệu & Mở Rộng Câu Trả Lời 🌟',
    topic: 'IELTS Part 1: Extension Strategies',
    description: 'Thầy Gojo kiểm tra kỹ thuật mở rộng câu trả lời tự nhiên bằng lý do và ví dụ thực tế.',
    icon: '👋',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Welcome to the IELTS Speaking test! I am examiner Gojo Satoru. First, could you tell me how you usually spend your weekends and how you relax?",
    initialTranslation: "Chào mừng bạn đến với phòng thi IELTS Speaking! Thầy là giám khảo Gojo Satoru. Đầu tiên, em hãy cho thầy biết em thường dành cuối tuần như thế nào và làm gì để thư giãn?",
    suggestedPrompts: [
      "To be honest, I usually unwind by reading books and hanging out with my close friends.",
      "I tend to spend my weekends exploring new coffee shops around the city.",
      "Well, on weekends I prioritize catching up on sleep and pursuing personal hobbies.",
    ],
    keyVocab: ['unwind after work', 'prioritize', 'spontaneous response', 'elaborate on ideas'],
  },
  {
    id: 'ielts-p1-u2-friendship',
    title: 'Unit 2: Friendship (Tình Bạn) 🤝',
    topic: 'IELTS Part 1: Friendship',
    description: 'Luyện nói về các mối quan hệ bạn bè, vòng tròn thân thiết và tiêu chí chọn bạn tri kỷ.',
    icon: '🤝',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Let's talk about friends! Do you have a large circle of friends, and what qualities do you value most in a close companion?",
    initialTranslation: "Hãy nói về bạn bè nhé! Cậu có nhiều bạn bè không, và phẩm chất nào cậu coi trọng nhất ở một người bạn thân?",
    suggestedPrompts: [
      "I prefer quality over quantity, so I keep a tight-knit circle of trusted friends.",
      "Trustworthiness and mutual respect are paramount for me in any friendship.",
      "I have known my best friends since high school and we support each other through thick and thin.",
    ],
    keyVocab: ['tight-knit circle', 'through thick and thin', 'confide in', 'trustworthiness', 'mutual respect'],
  },
  {
    id: 'ielts-p1-u3-texting',
    title: 'Unit 3: Text Messages (Tin Nhắn) 📱',
    topic: 'IELTS Part 1: Text Messages & Calls',
    description: 'Luyện trả lời so sánh giữa nhắn tin tức thời (Zalo, Messenger) và gọi điện thoại trực tiếp.',
    icon: '📱',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Now let's discuss communication. Do you prefer sending text messages or making direct phone calls to your friends?",
    initialTranslation: "Bây giờ chúng ta thảo luận về cách liên lạc nhé. Cậu thích nhắn tin qua ứng dụng hay gọi điện thoại trực tiếp hơn?",
    suggestedPrompts: [
      "I definitely prefer texting because it is convenient and allows me to reply whenever I have free time.",
      "For urgent matters, I always make a direct phone call to get an immediate response.",
      "With instant messaging apps like Zalo and Messenger, I text on a daily basis.",
    ],
    keyVocab: ['instant messaging', 'on a daily basis', 'urgent matters', 'keep in touch', 'top up'],
  },
  {
    id: 'ielts-p1-u4-travelling',
    title: 'Unit 4: Travelling & Seasons (Du Lịch) ✈️',
    topic: 'IELTS Part 1: Travelling & Tourism',
    description: 'Luyện nói về sở thích khám phá các vùng đất mới, các mùa lý tưởng và lòng hiếu khách.',
    icon: '✈️',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Travelling is wonderful! In which seasons do you prefer to travel, and would you say your country is welcoming to foreign tourists?",
    initialTranslation: "Du lịch thật tuyệt vời! Cậu thích đi du lịch vào mùa nào nhất, và đất nước cậu có hiếu khách với khách quốc tế không?",
    suggestedPrompts: [
      "I love travelling in autumn because the temperate conditions and clear skies make sightseeing delightful.",
      "Certainly, Vietnam is globally renowned for its warm hospitality and rich street food culture.",
      "Travelling broadens my horizons and offers an ideal getaway from the hustle and bustle.",
    ],
    keyVocab: ['temperate conditions', 'warm hospitality', 'ideal getaway', 'broaden horizons', 'breathtaking scenery'],
  },
  {
    id: 'ielts-p1-u5-transport',
    title: 'Unit 5: Transportation (Giao Thông) 🚌',
    topic: 'IELTS Part 1: Transportation & Commute',
    description: 'Thảo luận phương tiện giao thông phổ biến, xe buýt công cộng và giải pháp giảm khí thải.',
    icon: '🚌',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Let's move on to transportation. What's the most common means of transport in your city, and do you think people will drive more in the future?",
    initialTranslation: "Chuyển sang chủ đề giao thông nhé. Phương tiện nào phổ biến nhất ở thành phố cậu, và cậu nghĩ trong tương lai người ta có lái xe nhiều hơn không?",
    suggestedPrompts: [
      "Motorbikes are overwhelmingly popular in Vietnam because they are agile in heavy traffic.",
      "Due to severe environmental pollution, I believe people will transition to electric buses and trains.",
      "Public transit is cost-effective and helps ease gridlock during rush hours.",
    ],
    keyVocab: ['means of transport', 'vehicle emissions', 'traffic congestion', 'cost-effective', 'transition to public transit'],
  },
  {
    id: 'ielts-p1-u6-emails',
    title: 'Unit 6: Letters & Emails (Thư Từ & Email) ✉️',
    topic: 'IELTS Part 1: Written Correspondence',
    description: 'So sánh thư tay truyền thống và thư điện tử Email trong công việc hiện đại.',
    icon: '✉️',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Do you write many emails or letters, and do you prefer typing on a computer or handwriting on paper?",
    initialTranslation: "Cậu có hay viết email hoặc thư từ không, và cậu thích gõ máy tính hay viết tay trên giấy hơn?",
    suggestedPrompts: [
      "I rely heavily on emails for daily professional communication and exchanging proposals with clients.",
      "Typing saves immense time, whereas a handwritten letter carries distinct sentimental value.",
      "Email allows instantaneous cross-border collaboration without delays.",
    ],
    keyVocab: ['formal correspondence', 'exchange ideas', 'handwritten letter', 'instantaneous communication'],
  },
  {
    id: 'ielts-p1-u7-swimming',
    title: 'Unit 7: Swimming (Bơi Lội & Kỹ Năng) 🏊',
    topic: 'IELTS Part 1: Swimming & Health',
    description: 'Luyện nói về kỹ năng bơi lội, sinh tồn dưới nước và lợi ích rèn luyện sức khỏe.',
    icon: '🏊',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Can you swim? And do you strongly believe swimming should be a compulsory subject taught in all schools?",
    initialTranslation: "Cậu biết bơi không? Và cậu có nghĩ bơi lội nên là môn học bắt buộc trong mọi trường học không?",
    suggestedPrompts: [
      "Yes, I believe swimming is an indispensable life-saving skill that every child should master.",
      "Swimming provides an invigorating full-body workout that enhances cardiovascular endurance.",
      "Dipping into the cool pool after a sweltering summer day is the ultimate stress reliever.",
    ],
    keyVocab: ['life-saving skill', 'full-body workout', 'cardiovascular endurance', 'relieve stress', 'compulsory subject'],
  },
  {
    id: 'ielts-p1-u8-snacks',
    title: 'Unit 8: Snacks (Đồ Ăn Vặt & Dinh Dưỡng) 🍿',
    topic: 'IELTS Part 1: Snacks & Diet',
    description: 'Thảo luận về các món ăn vặt đường phố, tác hại của junk food và chế độ dinh dưỡng lành mạnh.',
    icon: '🍿',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "What kinds of snacks are popular in your country, and do you think snacking frequently has a negative impact on health?",
    initialTranslation: "Ở nước cậu những món ăn vặt nào được ưa chuộng, và cậu có nghĩ ăn vặt thường xuyên sẽ hại sức khỏe không?",
    suggestedPrompts: [
      "Street food snacks like rice paper rolls and sweet soup are immensely popular among youngsters.",
      "Excessive processed snacks packed with refined sugars are detrimental to our health.",
      "I prefer wholesome snacks like organic almonds and fresh fruits to maintain sustained energy.",
    ],
    keyVocab: ['detrimental to health', 'wholesome snacks', 'sustained energy', 'satisfy cravings', 'processed junk food'],
  },
  {
    id: 'ielts-p1-u9-photo',
    title: 'Unit 9: Photography (Nhiếp Ảnh) 📸',
    topic: 'IELTS Part 1: Photography & Memories',
    description: 'Luyện nói về sở thích chụp ảnh, lưu giữ dấu mốc cuộc đời và chụp ảnh phong cảnh.',
    icon: '📸',
    level: 'Band 7.5+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Do you enjoy taking photographs? In what situations do you usually take shots on your smartphone or camera?",
    initialTranslation: "Cậu có thích chụp ảnh không? Trong những dịp nào thì cậu thường cầm điện thoại hoặc máy ảnh lên chụp?",
    suggestedPrompts: [
      "I adore photography because it allows me to capture fleeting moments and preserve meaningful milestones.",
      "Whenever I embark on a trip, I take snapshots of scenic landmarks and unique local dishes.",
      "Photos serve as a visual diary that helps me relive golden memories years later.",
    ],
    keyVocab: ['capture fleeting moments', 'preserve milestones', 'photogenic', 'visual diary', 'relive golden memories'],
  },
  {
    id: 'ielts-p1-u10-help',
    title: 'Unit 10: Help & Volunteering (Giúp Đỡ) 🏆',
    topic: 'IELTS Part 1: Helping Others & Community',
    description: 'Thảo luận về tinh thần tương thân tương ái, giúp đỡ hàng xóm và hoạt động tình nguyện.',
    icon: '🏆',
    level: 'Band 8.0+',
    category: 'ielts-part-1' as any,
    initialAIMessage: "Excellent progress! For our final Part 1 topic: Do you like helping others, and how do people in your community support each other?",
    initialTranslation: "Tiến bộ xuất sắc! Chủ đề cuối của Part 1: Cậu có thích giúp đỡ người khác không, và mọi người trong khu phố hỗ trợ nhau thế nào?",
    suggestedPrompts: [
      "Lending a helping hand to those in need gives me an immense sense of purpose and fulfillment.",
      "Our neighborhood frequently organizes charity drives to support disadvantaged families.",
      "An altruistic mindset makes our society more compassionate and cohesive.",
    ],
    keyVocab: ['lend a helping hand', 'in need', 'altruistic spirit', 'immense fulfillment', 'compassionate community'],
  },

  // --- CHAPTER 2: IELTS SPEAKING PART 2 (THE LONG TURN & CUE CARDS) ---
  {
    id: 'ielts-p2-journey',
    title: 'Part 2 Cue Card: Chuyến Đi Đáng Nhớ 🗺️',
    topic: 'IELTS Part 2: Describe An Unforgettable Journey',
    description: 'Luyện thuyết trình 2 phút miêu tả một chuyến đi hoang sơ, cảnh đẹp và kỷ niệm khó quên.',
    icon: '🗺️',
    level: 'Band 8.5+',
    category: 'ielts-part-2' as any,
    cueCardPrompt: "Describe an unforgettable journey you went on. You should say: where you went, who you traveled with, what you did, and explain why this journey left a lasting impression on you.",
    initialAIMessage: "Welcome to Part 2! Here is your cue card: 'Describe an unforgettable journey you went on'. You have 1-2 minutes to present your story. Please begin whenever you're ready!",
    initialTranslation: "Chào mừng đến với Part 2! Đây là đề bài của em: 'Hãy miêu tả một chuyến đi đáng nhớ nhất'. Em có 1-2 phút để trình bày câu chuyện. Hãy bắt đầu bất cứ lúc nào nhé!",
    suggestedPrompts: [
      "I would like to talk about a memorable trip to Ha Giang with my closest university friends two years ago.",
      "We took a motorbike tour along majestic winding mountain passes off the beaten track.",
      "The breathtaking scenery and genuine warmth of the ethnic locals left an indelible mark on my mind.",
    ],
    keyVocab: ['off the beaten track', 'picturesque landscape', 'indelible impression', 'breathtaking scenery', 'pivotal turning point'],
  },
  {
    id: 'ielts-p2-person',
    title: 'Part 2 Cue Card: Người Bạn Ngưỡng Mộ 🌟',
    topic: 'IELTS Part 2: Describe A Role Model',
    description: 'Luyện thuyết trình 2 phút miêu tả người truyền cảm hứng, ý chí kiên định và phong thái sống.',
    icon: '🌟',
    level: 'Band 8.5+',
    category: 'ielts-part-2' as any,
    cueCardPrompt: "Describe a person who has inspired you deeply. You should say: who this person is, how you know them, what qualities they have, and explain why they inspire you so much.",
    initialAIMessage: "Let's practice your next Part 2 Cue Card: 'Describe a person who has inspired you'. Focus on their perseverance and core character traits. Take the floor!",
    initialTranslation: "Luyện đề Part 2 tiếp theo nhé: 'Miêu tả một người truyền cảm hứng sâu sắc cho bạn'. Hãy tập trung vào ý chí kiên định và tính cách của họ nhé!",
    suggestedPrompts: [
      "I would love to describe my high school teacher, who has been a tremendous role model in my life.",
      "She exemplifies unwavering determination and always approaches every obstacle with optimism.",
      "Her selflessness and down-to-earth demeanor serve as a beacon of hope for all her students.",
    ],
    keyVocab: ['unwavering determination', 'down-to-earth demeanor', 'beacon of hope', 'tremendous role model', 'perseverance'],
  },
  {
    id: 'ielts-p2-positive-change',
    title: 'Part 2 Cue Card: Thay Đổi Tích Cực 🚀',
    topic: 'IELTS Part 2: A Positive Change In Your Life',
    description: 'Miêu tả một thói quen tốt hoặc quyết định mang tính bước ngoặt thay đổi cuộc sống của bạn.',
    icon: '🚀',
    level: 'Band 8.5+',
    category: 'ielts-part-2' as any,
    cueCardPrompt: "Describe a positive change that you made in your life. You should say: what the change was, when and why you made it, how you accomplished it, and explain how this change has benefited you.",
    initialAIMessage: "Here is your Cue Card: 'Describe a positive change you made in your life'. Highlight the pivotal turning point and the lasting benefits. Let's hear your response!",
    initialTranslation: "Đề bài của bạn: 'Miêu tả một thay đổi tích cực trong cuộc sống của bạn'. Hãy nhấn mạnh bước ngoặt và lợi ích lâu dài nhé!",
    suggestedPrompts: [
      "A transformative change I made was establishing a consistent morning workout and meditation routine.",
      "Initially it required immense willpower, but it drastically boosted my focus and productivity.",
      "This simple habit has had a profound impact on my physical vitality and mental clarity.",
    ],
    keyVocab: ['transformative change', 'pivotal turning point', 'profound impact', 'mental clarity', 'immense willpower'],
  },

  // --- CHAPTER 3: IELTS SPEAKING PART 3 (IN-DEPTH DISCUSSION) ---
  {
    id: 'ielts-p3-reason-example',
    title: 'Part 3 Công Thức: Reason & Example 🧩',
    topic: 'IELTS Part 3: Formula Reason & Example',
    description: 'Áp dụng công thức vàng: Trả lời lập trường + Lý do thuyết phục + Ví dụ minh họa thực tiễn.',
    icon: '🧩',
    level: 'Band 8.5+',
    category: 'ielts-part-3' as any,
    initialAIMessage: "Welcome to Part 3! Let's examine educational equality: 'Do you think school uniforms should be made compulsory for all students, and why?'",
    initialTranslation: "Chào mừng đến với Part 3! Hãy cùng phân tích bình đẳng học đường: 'Theo em đồng phục học sinh có nên là bắt buộc đối với tất cả học sinh không, và tại sao?'",
    suggestedPrompts: [
      "I firmly advocate for school uniforms because they effectively bridge socio-economic disparities among pupils.",
      "For instance, when students wear the same attire, it diminishes peer pressure related to high-end fashion brands.",
      "Furthermore, uniforms instill a profound sense of school identity, unity, and academic discipline.",
    ],
    keyVocab: ['bridge socio-economic disparities', 'peer pressure', 'instill a sense of unity', 'compulsory policy'],
  },
  {
    id: 'ielts-p3-distance-yourself',
    title: 'Part 3 Kỹ Thuật: Distance Yourself 🌐',
    topic: 'IELTS Part 3: Objective Perspectives',
    description: 'Nâng tầm câu trả lời bằng góc nhìn xã hội khách quan thay cho quan điểm cá nhân hạn hẹp.',
    icon: '🌐',
    level: 'Band 8.5+',
    category: 'ielts-part-3' as any,
    initialAIMessage: "Here is a debate on media and technology: 'Is it still necessary to hire professional photographers for important milestones when smartphones take 4K photos?'",
    initialTranslation: "Một chủ đề tranh luận thú vị: 'Liệu có còn cần thuê thợ ảnh chuyên nghiệp cho các dịp trọng đại khi smartphone đã chụp được ảnh 4K không?'",
    suggestedPrompts: [
      "It is widely acknowledged that seasoned photographers possess specialized lighting expertise that no phone can replicate.",
      "On momentous occasions like wedding ceremonies, relying on professionals ensures peace of mind and pristine quality.",
      "However, for everyday gatherings, high-end smartphones are undeniably more than adequate.",
    ],
    keyVocab: ['widely acknowledged', 'momentous occasions', 'seasoned professional', 'more than adequate', 'pristine quality'],
  },
  {
    id: 'ielts-p3-future-speculation',
    title: 'Part 3 Kỹ Thuật: Dự Đoán Tương Lai 🔮',
    topic: 'IELTS Part 3: Future Predictions & AI',
    description: 'Kỹ thuật dùng câu suy luận tương lai: AI, công nghệ sinh học và các vấn đề đạo đức xã hội.',
    icon: '🔮',
    level: 'Band 9.0',
    category: 'ielts-part-3' as any,
    initialAIMessage: "Looking ahead: 'How will artificial intelligence and automation reshape the job market and human society in the next two decades?'",
    initialTranslation: "Dự đoán tương lai: 'Trí tuệ nhân tạo và tự động hóa sẽ định hình lại thị trường việc làm và xã hội loài người như thế nào trong 20 năm tới?'",
    suggestedPrompts: [
      "There is a high likelihood that AI will automate routine tasks, thereby creating unprecedented demand for creative problem-solvers.",
      "Nevertheless, governments must institute stringent ethical frameworks to protect workers from technological displacement.",
      "The synergy between humans and machine intelligence will unlock unprecedented frontiers in medicine and science.",
    ],
    keyVocab: ['high likelihood', 'unprecedented frontiers', 'stringent frameworks', 'technological displacement', 'ethical dilemmas'],
  },

  // --- PRESETS: DAILY LIFE & BUSINESS ---
  {
    id: 'free-talk',
    title: 'Trò Chuyện Tự Do Cùng Gojo Satoru 🕶️',
    topic: 'Free Talk & Daily Life',
    description: 'Tâm sự, hỏi đáp mọi chủ đề từ cuộc sống, sở thích, anime đến bí quyết học tiếng Anh cùng Gojo.',
    icon: '⚡',
    level: 'Beginner',
    category: 'daily' as any,
    initialAIMessage: "Yo! Gojo Satoru is here. What's on your mind today? How are you feeling, and what did you do today?",
    initialTranslation: "Yo! Thầy Gojo Satoru đây. Hôm nay cậu thế nào? Cậu đã làm những gì trong ngày hôm nay rồi?",
    suggestedPrompts: [
      "I'm feeling great! Tell me about your powers.",
      "I want to practice my English speaking skills.",
      "What are some tips to learn English vocabulary faster?",
    ],
  },
  {
    id: 'job-interview',
    title: 'Phỏng Vấn Xin Việc Quốc Tế 💼',
    topic: 'Job Interview Practice',
    description: 'Luyện trả lời các câu hỏi phỏng vấn phổ biến: giới thiệu bản thân, điểm mạnh & kinh nghiệm.',
    icon: '💼',
    level: 'Advanced',
    category: 'business' as any,
    initialAIMessage: "Welcome to the interview. Could you please introduce yourself and tell me a bit about your background?",
    initialTranslation: "Chào mừng bạn đến với buổi phỏng vấn. Bạn có thể giới thiệu đôi nét về bản thân và kinh nghiệm của mình không?",
    suggestedPrompts: [
      "Sure! I have 3 years of experience in software development and I love problem-solving.",
      "Hello! I am a passionate learner with strong communication and team leadership skills.",
      "I graduated recently and I'm very excited about this position at your company.",
    ],
  },
  {
    id: 'coffee-shop',
    title: 'Gọi Món Tại Quán Cà Phê ☕',
    topic: 'At a Coffee Shop',
    description: 'Thực hành order đồ uống, chọn size, điều chỉnh lượng đường đá và thanh toán.',
    icon: '☕',
    level: 'Beginner',
    category: 'daily' as any,
    initialAIMessage: "Hi there! Welcome to Gojo Cafe. What can I get started for you today?",
    initialTranslation: "Xin chào! Chào mừng bạn đến với Gojo Cafe. Hôm nay bạn muốn dùng thức uống gì nào?",
    suggestedPrompts: [
      "Can I get an iced caramel latte with oat milk, please?",
      "What do you recommend for someone who loves sweet coffee?",
      "How much is a large cappuccino and a croissant?",
    ],
  },
];

// Smart grammar & natural phrasing checker
function analyzeGrammar(userText: string): { correction?: string; tip?: string } {
  const t = userText.trim().toLowerCase();

  if (/\bi (is|are)\b/.test(t)) {
    return {
      correction: userText.replace(/\bi is\b/gi, 'I am').replace(/\bi are\b/gi, 'I am'),
      tip: 'Ghi nhớ: Đại từ "I" luôn đi cùng trợ động từ "am" trong thì hiện tại đơn.',
    };
  }
  if (/\bhe (don't|dont)\b/.test(t) || /\bshe (don't|dont)\b/.test(t)) {
    return {
      correction: userText.replace(/\bdon't\b/gi, "doesn't").replace(/\bdont\b/gi, "doesn't"),
      tip: 'Chủ ngữ ngôi thứ 3 số ít (He, She, It) dùng "doesn\'t" trong câu phủ định.',
    };
  }
  if (/\bcan (to speak|to do|to go)\b/.test(t)) {
    return {
      correction: userText.replace(/can to /gi, 'can '),
      tip: 'Sau modal verb "can" luôn dùng động từ nguyên thể không "to" (Bare Infinitive).',
    };
  }

  return {};
}

// Evaluate user's spoken answer across IELTS/Communication criteria
function evaluateUserAnswer(userMessage: string, _scenario: ConversationScenario): AnswerEvaluation {
  const words = userMessage.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let estimatedBand = 'Band 6.5';
  let score = 68;
  let fluency = 'Nhịp điệu ổn định, phát triển ý cơ bản.';
  let vocab = 'Vốn từ phù hợp với chủ đề.';
  let grammar = 'Cấu trúc câu chuẩn xác.';
  let summary = 'Câu trả lời đầy đủ ý, diễn đạt tự nhiên.';

  if (wordCount >= 35) {
    estimatedBand = 'Band 7.5';
    score = 78;
    fluency = 'Độ trôi chảy tốt, liên kết câu tự nhiên.';
    vocab = 'Vận dụng được cụm từ mở rộng hay.';
    grammar = 'Kết hợp câu phức linh hoạt.';
    summary = 'Ý tưởng phong phú, diễn đạt lưu loát.';
  } else if (wordCount >= 18) {
    estimatedBand = 'Band 7.0';
    score = 72;
    fluency = 'Tốc độ nói đều đặn, có triển khai ý.';
    vocab = 'Từ vựng đa dạng, đúng ngữ cảnh.';
    grammar = 'Ngữ pháp ổn định, ít lỗi sai.';
    summary = 'Trả lời rõ ràng, mạch lạc.';
  } else if (wordCount < 8) {
    estimatedBand = 'Band 6.0';
    score = 62;
    fluency = 'Câu trả lời còn ngắn, nên mở rộng thêm lý do.';
    vocab = 'Từ vựng cơ bản, có thể thêm tính từ miêu tả.';
    grammar = 'Cấu trúc đơn giản.';
    summary = 'Nên mở rộng câu bằng công thức Lý do + Ví dụ.';
  }

  return {
    estimatedBand,
    score,
    fluencyFeedback: fluency,
    vocabFeedback: vocab,
    grammarFeedback: grammar,
    summary,
  };
}

// Live Google Gemini API Integration for real-time natural IELTS Examiner conversations
async function callGeminiAPI(
  userMessage: string,
  scenario: ConversationScenario,
  history: AIChatMessage[],
  apiKey: string
): Promise<{
  text: string;
  translation: string;
  correction?: string;
  tip?: string;
  evaluation?: AnswerEvaluation;
  suggestedPrompts: string[];
} | null> {
  const isFreeChat = scenario.id === 'gemini-free-chat';
  const roleDescription = isFreeChat
    ? `You are Google Gemini AI, a brilliant, super friendly, patient personal English Tutor and Conversational Partner.
You help learners practice English naturally, answer any questions about grammar, vocabulary, idioms, pronunciation, and engage in fun, insightful conversation.`
    : `You are Gojo Satoru, an energetic, charismatic, supportive IELTS Speaking examiner and English coach.
Scenario: "${scenario.title}" (Topic: ${scenario.topic}, Level: ${scenario.level}).
${scenario.cueCardPrompt ? `Cue Card Prompt: ${scenario.cueCardPrompt}` : ''}
${scenario.keyVocab ? `Key Collocations from curriculum: ${scenario.keyVocab.join(', ')}` : ''}`;

  const prompt = `${roleDescription}

Recent conversation:
${history.slice(-4).map((m) => `${m.sender === 'user' ? 'Student' : 'AI Tutor'}: ${m.text}`).join('\n')}

Student's new message: "${userMessage}"

Evaluate the student's answer or question, and respond as the AI Tutor.
Respond in strict JSON with the following structure:
{
  "text": "Your English response responding naturally to the student, encouraging them, answering their question, and asking the next natural follow-up question (1-3 sentences or clear concise explanation)",
  "translation": "Bản dịch tiếng Việt tự nhiên và thân thiện cho câu nói trên của bạn",
  "correction": "Optional: câu tiếng Anh đúng ngữ pháp/tự nhiên hơn nếu học sinh có lỗi sai, nếu không có lỗi thì để null",
  "tip": "Optional: mẹo ngữ pháp/dùng từ bằng tiếng Việt giải thích ngắn gọn, nếu không có thì để null",
  "evaluation": {
    "estimatedBand": "Band 6.5 / Band 7.0 / Band 7.5 / Band 8.0",
    "score": 75,
    "fluencyFeedback": "Nhận xét độ trôi chảy bằng tiếng Việt ngắn gọn",
    "vocabFeedback": "Nhận xét vốn từ vựng bằng tiếng Việt ngắn gọn",
    "grammarFeedback": "Nhận xét ngữ pháp bằng tiếng Việt ngắn gọn",
    "summary": "Tóm tắt đánh giá chung về câu trả lời bằng tiếng Việt"
  },
  "suggestedPrompts": [
    "Câu gợi ý trả lời/hỏi tiếp theo 1 bằng tiếng Anh cho học sinh",
    "Câu gợi ý trả lời/hỏi tiếp theo 2 bằng tiếng Anh cho học sinh",
    "Câu gợi ý trả lời/hỏi tiếp theo 3 bằng tiếng Anh cho học sinh"
  ]
}`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

  for (const model of modelsToTry) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          rawJson = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          return JSON.parse(rawJson);
        }
      }
    } catch (err) {
      console.warn(`Gemini model ${model} attempt failed, trying next...`, err);
    }
  }

  return null;
}

// Generate context-aware AI tutor replies with Gojo Satoru persona
export async function generateAIResponse(
  userMessage: string,
  scenario: ConversationScenario,
  _history: AIChatMessage[]
): Promise<{
  text: string;
  translation: string;
  correction?: string;
  tip?: string;
  evaluation?: AnswerEvaluation;
  suggestedPrompts: string[];
}> {
  // Check if real Gemini API Key is provided in Settings
  const settings = storage.getSettings();
  if (settings.geminiApiKey?.trim()) {
    const liveAIResponse = await callGeminiAPI(
      userMessage,
      scenario,
      _history,
      settings.geminiApiKey.trim()
    );
    if (liveAIResponse && liveAIResponse.text) {
      return liveAIResponse;
    }
  }

  const { correction, tip } = analyzeGrammar(userMessage);
  const evaluation = evaluateUserAnswer(userMessage, scenario);
  const lower = userMessage.toLowerCase();

  // Dynamic responses according to IELTS Speaking topics
  if (scenario.id.startsWith('ielts-p1')) {
    const responses = [
      {
        text: `That was a very natural and fluent point! I really like how you elaborated. To achieve Band 8.0+, let's dive deeper: Could you give me another specific instance or explain how this differs from other people in your country?`,
        translation: `Câu trả lời rất tự nhiên và trôi chảy! Thầy rất thích cách em phát triển ý. Để chạm mốc Band 8.0+, hãy đi sâu hơn: Em có thể cho thầy một ví dụ cụ thể khác hoặc so sánh xem điều này khác với người khác thế nào không?`,
        prompts: [
          `In my country, most youngsters share a similar outlook on this matter.`,
          `Compared to the older generation, we tend to embrace modern approaches.`,
          `Another prominent example that springs to mind is our annual cultural festival.`,
        ],
      },
      {
        text: `Splendid vocabulary usage! Your pronunciation clarity is shining. How has this habit or preference evolved over the past five years in your personal life?`,
        translation: `Vốn từ vựng sử dụng rất xuất sắc! Phát âm cũng rất rõ ràng. Thói quen hoặc sở thích này đã thay đổi như thế nào trong suốt 5 năm qua đối với em?`,
        prompts: [
          `Over the past five years, I have become noticeably more deliberate in my choices.`,
          `Back in the day I barely paid attention, but now it is an essential part of my life.`,
          `My perspective shifted significantly after I started working full-time.`,
        ],
      },
      {
        text: `Terrific response! You connected your sentences seamlessly. Would you recommend this to a foreign visitor exploring your culture for the first time?`,
        translation: `Câu trả lời tuyệt vời! Em liên kết các câu rất mạch lạc. Em có gợi ý điều này cho một du khách nước ngoài lần đầu khám phá văn hóa nước em không?`,
        prompts: [
          `Without a doubt! Foreign visitors would find it an enriching and authentic experience.`,
          `I would highly recommend exploring local markets to truly immerse in the vibe.`,
          `It offers a unique window into our traditions and genuine hospitality.`,
        ],
      },
    ];

    const pick = responses[Math.floor(Math.random() * responses.length)];
    return { ...pick, correction, tip, evaluation, suggestedPrompts: pick.prompts };
  }

  if (scenario.id.startsWith('ielts-p2')) {
    return {
      text: `Outstanding delivery! Your storytelling in Part 2 was cohesive, well-paced, and rich in descriptive adjectives. Now, let me ask you a follow-up question: Looking back, how did this milestone reshape your mindset?`,
      translation: `Phần trình bày Part 2 rất xuất sắc! Câu chuyện mạch lạc, nhịp điệu tốt và giàu tính từ miêu tả. Bây giờ cho thầy hỏi một câu hỏi phụ: Nhìn lại, dấu mốc đó đã định hình lại tư duy của em ra sao?`,
      correction,
      tip,
      evaluation,
      suggestedPrompts: [
        `It taught me that resilience is far more valuable than immediate gratification.`,
        `Since that pivotal moment, I approach every challenge with unshakeable confidence.`,
        `It helped me realize the profound importance of continuous self-improvement.`,
      ],
    };
  }

  if (scenario.id.startsWith('ielts-p3')) {
    return {
      text: `Impressive critical thinking! You justified your viewpoint with strong reasoning and objective phrasing. Let's push further: What counterarguments might opponents raise against your proposition?`,
      translation: `Tư duy phản biện rất ấn tượng! Em đã bảo vệ quan điểm bằng lập luận chặt chẽ và lối diễn đạt khách quan. Hãy mở rộng thêm: Những người có quan điểm đối lập có thể đưa ra phản biện gì về đề xuất này?`,
      correction,
      tip,
      evaluation,
      suggestedPrompts: [
        `Critics might argue that financial constraints could impede widespread adoption.`,
        `On the other hand, some believe individual freedom should supersede regulatory rules.`,
        `A valid counterargument is that over-reliance on technology might erode essential human skills.`,
      ],
    };
  }

  // Default fallback response
  return {
    text: `That's an insightful point! Keep speaking with that strong rhythm and confidence. What other perspectives would you like to explore on this topic?`,
    translation: `Một quan điểm rất sâu sắc! Hãy tiếp tục duy trì nhịp điệu và sự tự tin này nhé. Cậu muốn khám phá thêm góc nhìn nào về chủ đề này nữa?`,
    correction,
    tip,
    evaluation,
    suggestedPrompts: [
      `I'd love to discuss the practical benefits in real life.`,
      `Could you share a high-band idiom that fits this context?`,
      `Let's move to the next question or scenario!`,
    ],
  };
}
