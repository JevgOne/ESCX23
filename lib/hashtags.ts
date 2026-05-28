// Hashtag categories for filtering girls

export interface Hashtag {
  id: string;
  category: 'appearance' | 'body' | 'age' | 'profession' | 'origin' | 'style';
  translations: {
    cs: string;
    en: string;
    de: string;
    uk: string;
  };
}

export const HASHTAGS: Hashtag[] = [
  // Hair Color
  { id: 'zrzky-praha', category: 'appearance', translations: { cs: 'zrzky praha', en: 'redheads prague', de: 'rothaarige prag', uk: 'руді прага' } },
  { id: 'blondynky-praha', category: 'appearance', translations: { cs: 'blondýnky praha', en: 'blondes prague', de: 'blondinen prag', uk: 'блондинки прага' } },
  { id: 'brunetky-praha', category: 'appearance', translations: { cs: 'brunetky praha', en: 'brunettes prague', de: 'brünetten prag', uk: 'брюнетки прага' } },
  { id: 'cernovlasky-praha', category: 'appearance', translations: { cs: 'černovlásky praha', en: 'black hair prague', de: 'schwarzhaarige prag', uk: 'чорноволосі прага' } },

  // Body Features
  { id: 'silikonove-prsa', category: 'body', translations: { cs: 'silikonové prsa', en: 'silicone breasts', de: 'silikonbrüste', uk: 'силіконові груди' } },
  { id: 'prirodni-poprsi', category: 'body', translations: { cs: 'přirodní poprsí', en: 'natural breasts', de: 'natürliche brüste', uk: 'натуральні груди' } },
  { id: 'velka-prsa', category: 'body', translations: { cs: 'velká prsa', en: 'big breasts', de: 'große brüste', uk: 'великі груди' } },
  { id: 'dlouhe-nohy', category: 'body', translations: { cs: 'dlouhé nohy', en: 'long legs', de: 'lange beine', uk: 'довгі ноги' } },
  { id: 'plne-rty', category: 'body', translations: { cs: 'plné rty', en: 'full lips', de: 'volle lippen', uk: 'повні губи' } },
  { id: 'kratke-vlasy', category: 'appearance', translations: { cs: 'krátké vlasy', en: 'short hair', de: 'kurze haare', uk: 'коротке волосся' } },

  // Style & Features
  { id: 'tetovani', category: 'style', translations: { cs: 'tetování', en: 'tattoos', de: 'tätowierungen', uk: 'татуювання' } },
  { id: 'piercing-holky', category: 'style', translations: { cs: 'piercing holky', en: 'pierced girls', de: 'gepierct mädchen', uk: 'пірсинг дівчата' } },
  { id: 'fit-holky', category: 'body', translations: { cs: 'fit holky', en: 'fit girls', de: 'sportliche mädchen', uk: 'спортивні дівчата' } },

  // Body Shape
  { id: 'stihla-postava', category: 'body', translations: { cs: 'štíhlá postava', en: 'slim body', de: 'schlanke figur', uk: 'стрункі фігура' } },
  { id: 'krivky', category: 'body', translations: { cs: 'křivky', en: 'curves', de: 'kurven', uk: 'криві' } },
  { id: 'bujne-tvary', category: 'body', translations: { cs: 'bujné tvary', en: 'voluptuous', de: 'üppige formen', uk: 'пишні форми' } },

  // Age Groups
  { id: 'mlade-holky', category: 'age', translations: { cs: 'mladé holky', en: 'young girls', de: 'junge mädchen', uk: 'молоді дівчата' } },
  { id: 'zrale-zeny', category: 'age', translations: { cs: 'zralé ženy', en: 'mature women', de: 'reife frauen', uk: 'зрілі жінки' } },
  { id: 'milf-praha', category: 'age', translations: { cs: 'milf praha', en: 'milf prague', de: 'milf prag', uk: 'мілф прага' } },

  // Profession/Type
  { id: 'studentky-praha', category: 'profession', translations: { cs: 'studentky praha', en: 'students prague', de: 'studentinnen prag', uk: 'студентки прага' } },
  { id: 'modelky-praha', category: 'profession', translations: { cs: 'modelky praha', en: 'models prague', de: 'models prag', uk: 'моделі прага' } },

  // Origin
  { id: 'exoticke-krasky', category: 'origin', translations: { cs: 'exotické krásky', en: 'exotic beauties', de: 'exotische schönheiten', uk: 'екзотичні красуні' } },
  { id: 'ceske-holky', category: 'origin', translations: { cs: 'české holky', en: 'czech girls', de: 'tschechische mädchen', uk: 'чеські дівчата' } },
  { id: 'slovenske-holky', category: 'origin', translations: { cs: 'slovenské holky', en: 'slovak girls', de: 'slowakische mädchen', uk: 'словацькі дівчата' } },
  { id: 'ukrajinske-holky', category: 'origin', translations: { cs: 'ukrajinské holky', en: 'ukrainian girls', de: 'ukrainische mädchen', uk: 'українські дівчата' } },
  { id: 'ruske-holky', category: 'origin', translations: { cs: 'ruské holky', en: 'russian girls', de: 'russische mädchen', uk: 'російські дівчата' } },
  { id: 'latinky', category: 'origin', translations: { cs: 'latinky', en: 'latinas', de: 'latinas', uk: 'латинки' } },
  { id: 'asiatky', category: 'origin', translations: { cs: 'asiatky', en: 'asians', de: 'asiatinnen', uk: 'азіатки' } },

  // General
  { id: 'holky-praha', category: 'origin', translations: { cs: 'holky praha', en: 'girls prague', de: 'mädchen prag', uk: 'дівчата прага' } },
  { id: 'spolecnice-praha', category: 'profession', translations: { cs: 'společnice praha', en: 'escorts prague', de: 'begleiterinnen prag', uk: 'супроводжувальниці прага' } },
  { id: 'girlfriend-experience', category: 'style', translations: { cs: 'girlfriend experience', en: 'girlfriend experience', de: 'girlfriend experience', uk: 'girlfriend experience' } },
  { id: 'gfe-praha', category: 'style', translations: { cs: 'gfe praha', en: 'gfe prague', de: 'gfe prag', uk: 'gfe прага' } },

  // Sexy & Attractive
  { id: 'sexy-holky', category: 'style', translations: { cs: 'sexy holky', en: 'sexy girls', de: 'sexy mädchen', uk: 'сексуальні дівчата' } },
  { id: 'krasne-holky', category: 'appearance', translations: { cs: 'krásné holky', en: 'beautiful girls', de: 'schöne mädchen', uk: 'красиві дівчата' } },
  { id: 'hot-holky-praha', category: 'style', translations: { cs: 'hot holky praha', en: 'hot girls prague', de: 'heiße mädchen prag', uk: 'гарячі дівчата прага' } },
  { id: 'dokonale-telo', category: 'body', translations: { cs: 'dokonalé tělo', en: 'perfect body', de: 'perfekter körper', uk: 'досконале тіло' } },

  // Premium Services
  { id: 'vip-holky', category: 'profession', translations: { cs: 'vip holky', en: 'vip girls', de: 'vip mädchen', uk: 'vip дівчата' } },
  { id: 'luxusni-sluzby', category: 'profession', translations: { cs: 'luxusní služby', en: 'luxury services', de: 'luxusdienstleistungen', uk: 'розкішні послуги' } },
  { id: 'privatni-sluzby', category: 'profession', translations: { cs: 'privátní služby', en: 'private services', de: 'private dienstleistungen', uk: 'приватні послуги' } },

  // Physical Features
  { id: 'dlouhe-vlasy', category: 'appearance', translations: { cs: 'dlouhé vlasy', en: 'long hair', de: 'lange haare', uk: 'довге волосся' } },
  { id: 'modre-oci', category: 'appearance', translations: { cs: 'modré oči', en: 'blue eyes', de: 'blaue augen', uk: 'блакитні очі' } },
  { id: 'vysoke-holky', category: 'body', translations: { cs: 'vysoké holky', en: 'tall girls', de: 'große mädchen', uk: 'високі дівчата' } },
  { id: 'atleticke-telo', category: 'body', translations: { cs: 'atletické tělo', en: 'athletic body', de: 'athletischer körper', uk: 'атлетичне тіло' } },

  // Style & Elegance
  { id: 'elegantni-holky', category: 'style', translations: { cs: 'elegantní holky', en: 'elegant girls', de: 'elegante mädchen', uk: 'елегантні дівчата' } },
];

export function getHashtagById(id: string): Hashtag | undefined {
  return HASHTAGS.find(h => h.id === id);
}

export function getHashtagName(id: string, locale: string = 'cs'): string {
  const hashtag = getHashtagById(id);
  if (!hashtag) return id;

  const lang = locale as 'cs' | 'en' | 'de' | 'uk';
  return hashtag.translations[lang] || hashtag.translations.cs;
}

export function getHashtagsByCategory(category: Hashtag['category']): Hashtag[] {
  return HASHTAGS.filter(h => h.category === category);
}
