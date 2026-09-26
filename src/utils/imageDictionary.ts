/**
 * Image Dictionary Utility
 * Provides curated, memorable visual illustrations for English vocabulary words
 * and dynamic image search fallbacks to ensure every card has a vivid image.
 */

// Curated high-yield vocabulary illustrations (Unsplash direct high-speed CDN)
export const CURATED_IMAGE_MAP: Record<string, string> = {
  // 4000 Essential English Words - Book 1 & Common Starter Words
  afraid: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=80',
  agree: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&auto=format&fit=crop&q=80',
  angry: 'https://images.unsplash.com/photo-1578496479763-c21c718af028?w=400&auto=format&fit=crop&q=80',
  arrive: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&auto=format&fit=crop&q=80',
  attack: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&auto=format&fit=crop&q=80',
  bottom: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&auto=format&fit=crop&q=80',
  clever: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
  cruel: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
  finally: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
  hide: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&auto=format&fit=crop&q=80',
  hunt: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&auto=format&fit=crop&q=80',
  lot: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop&q=80',
  middle: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=400&auto=format&fit=crop&q=80',
  moment: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&auto=format&fit=crop&q=80',
  pleased: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  promise: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&auto=format&fit=crop&q=80',
  reply: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=400&auto=format&fit=crop&q=80',
  safe: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
  trick: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?w=400&auto=format&fit=crop&q=80',
  well: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',

  // Common Daily & Feeling Words
  happy: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
  sad: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=400&auto=format&fit=crop&q=80',
  tired: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80',
  scared: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=80',
  brave: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400&auto=format&fit=crop&q=80',
  calm: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
  proud: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
  nervous: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&auto=format&fit=crop&q=80',
  love: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80',
  hate: 'https://images.unsplash.com/photo-1578496479763-c21c718af028?w=400&auto=format&fit=crop&q=80',

  // Destination B1 - Travel & Transport
  voyage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&auto=format&fit=crop&q=80',
  journey: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&auto=format&fit=crop&q=80',
  trip: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80',
  excursion: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&auto=format&fit=crop&q=80',
  view: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80',
  sight: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80',
  flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&auto=format&fit=crop&q=80',
  cruise: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&auto=format&fit=crop&q=80',
  passport: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  luggage: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=400&auto=format&fit=crop&q=80',
  platform: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&auto=format&fit=crop&q=80',

  // Destination B1 - Hobbies, Sport & Games
  pitch: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
  court: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&auto=format&fit=crop&q=80',
  ring: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&auto=format&fit=crop&q=80',
  rink: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
  spectator: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=400&auto=format&fit=crop&q=80',
  spectators: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=400&auto=format&fit=crop&q=80',
  viewer: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&auto=format&fit=crop&q=80',
  referee: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop&q=80',
  umpire: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop&q=80',
  athlete: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400&auto=format&fit=crop&q=80',
  champion: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=400&auto=format&fit=crop&q=80',
  coach: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&auto=format&fit=crop&q=80',

  // Destination B1 - Science & Technology
  artificial: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
  invent: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
  discover: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80',
  engine: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80',
  machine: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
  laboratory: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80',
  gadget: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
  hardware: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&auto=format&fit=crop&q=80',
  software: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',

  // Destination B1 - Media & Communication
  headline: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80',
  tabloid: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80',
  broadsheet: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80',
  broadcast: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
  journalist: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&auto=format&fit=crop&q=80',

  // Food & Objects
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
  book: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&auto=format&fit=crop&q=80',
  car: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80',
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
  guitar: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
  school: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=80',
  library: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&auto=format&fit=crop&q=80',
};

/**
 * Clean word string to lookup key
 */
export function normalizeWord(word: string): string {
  if (!word) return '';
  return word
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"\[\]]/g, '')
    .split(/\s+/)[0]; // take first main word if phrase
}

/**
 * Get an illustration URL for a card:
 * 1. Card's own custom image (if uploaded / present)
 * 2. Hand-curated image from dictionary
 * 3. Topic-based smart fallback illustration
 */
export function getCardIllustration(
  frontText?: string,
  existingImage?: string
): string {
  if (existingImage && existingImage.trim() !== '') {
    return existingImage.trim();
  }

  if (!frontText) {
    return '/we_bare_bears.png';
  }

  const clean = normalizeWord(frontText);

  // 1. Direct match in curated map
  if (CURATED_IMAGE_MAP[clean]) {
    return CURATED_IMAGE_MAP[clean];
  }

  // 2. Fallback to cute We Bare Bears educational character
  return '/we_bare_bears.png';
}

/**
 * Compress an uploaded user image into a lightweight data URL
 * to avoid blowing up localStorage (~30KB JPEG).
 */
export function compressImageFile(file: File, maxDimension = 480, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
