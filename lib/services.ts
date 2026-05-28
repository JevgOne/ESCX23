// Service configuration with multi-language support

export interface Service {
  id: string;
  category: 'basic' | 'extra';
  translations: {
    cs: string;
    en: string;
    de: string;
    uk: string;
  };
}

export const SERVICES: Service[] = [
  // BASIC SERVICES - Every girl offers these (mandatory)
  { id: 'classic', category: 'basic', translations: { cs: 'Klasika', en: 'Classic', de: 'Klassisch', uk: 'Класичний' } },
  { id: 'blowjob_condom', category: 'basic', translations: { cs: 'Blowjob s kondomen', en: 'Blowjob with condom', de: 'Blowjob mit Kondom', uk: 'Мінет з презервативом' } },
  { id: 'massage', category: 'basic', translations: { cs: 'Masáž', en: 'Massage', de: 'Massage', uk: 'Масаж' } },
  { id: 'cuddling', category: 'basic', translations: { cs: 'Mazlení', en: 'Cuddling', de: 'Kuscheln', uk: 'Обійми' } },
  { id: 'licking', category: 'basic', translations: { cs: 'Lízání', en: 'Licking', de: 'Lecken', uk: 'Лизання' } },
  { id: '69', category: 'basic', translations: { cs: '69', en: '69', de: '69', uk: '69' } },
  { id: 'cum_on_body', category: 'basic', translations: { cs: 'Výstřik na tělo', en: 'Cum on body', de: 'Sperma auf Körper', uk: 'Кінчання на тіло' } },
  { id: 'shared_shower', category: 'basic', translations: { cs: 'Společná sprcha', en: 'Shared shower', de: 'Gemeinsame Dusche', uk: 'Спільний душ' } },

  // EXTRA SERVICES - Optional
  { id: 'erotic_massage', category: 'extra', translations: { cs: 'Erotická masáž', en: 'Erotic massage', de: 'Erotische Massage', uk: 'Еротичний масаж' } },
  { id: 'prostate_massage', category: 'extra', translations: { cs: 'Masáž prostaty', en: 'Prostate massage', de: 'Prostatamassage', uk: 'Масаж простати' } },
  { id: 'hard_sex', category: 'extra', translations: { cs: 'Tvrdý sex', en: 'Hard sex', de: 'Harter Sex', uk: 'Жорсткий секс' } },
  { id: 'light_sm', category: 'extra', translations: { cs: 'Lehké SM', en: 'Light SM', de: 'Leichtes SM', uk: 'Легкий СМ' } },
  { id: 'facesitting', category: 'extra', translations: { cs: 'Facesitting', en: 'Facesitting', de: 'Facesitting', uk: 'Фейсситінг' } },
  { id: 'foot_fetish', category: 'extra', translations: { cs: 'Foot fetish', en: 'Foot fetish', de: 'Fußfetisch', uk: 'Футфетиш' } },
  { id: 'bdsm', category: 'extra', translations: { cs: 'BDSM', en: 'BDSM', de: 'BDSM', uk: 'БДСМ' } },
  { id: 'lesbi_show', category: 'extra', translations: { cs: 'Lesbi show', en: 'Lesbian show', de: 'Lesben-Show', uk: 'Лесбі-шоу' } },
  { id: 'role_play', category: 'extra', translations: { cs: 'Role-play', en: 'Role-play', de: 'Rollenspiel', uk: 'Рольова гра' } },
  { id: 'bondage', category: 'extra', translations: { cs: 'Svazování', en: 'Bondage', de: 'Bondage', uk: 'Бондаж' } },
  { id: 'threesome_fmf', category: 'extra', translations: { cs: 'Bi trojka (MŽŽ)', en: 'Bi threesome (MFF)', de: 'Bi-Dreier (MFF)', uk: 'Бі трійка (MFF)' } },
  { id: 'threesome_mfm', category: 'extra', translations: { cs: 'Trojka (MŽM)', en: 'Threesome (MFM)', de: 'Dreier (MFM)', uk: 'Трійка (MFM)' } },
  { id: 'kissing', category: 'extra', translations: { cs: 'Líbání', en: 'Kissing', de: 'Küssen', uk: 'Поцілунки' } },
  { id: 'blowjob_no_condom', category: 'extra', translations: { cs: 'Orál bez kondomu', en: 'Blowjob without condom', de: 'Blowjob ohne Kondom', uk: 'Мінет без презерватива' } },
  { id: 'deepthroat', category: 'extra', translations: { cs: 'Hluboký orál', en: 'Deepthroat', de: 'Deepthroat', uk: 'Глибоке горло' } },
  { id: 'cof', category: 'extra', translations: { cs: 'Výstřik na obličej', en: 'Cum on face', de: 'Sperma im Gesicht', uk: 'Кінчання на обличчя' } },
  { id: 'cim', category: 'extra', translations: { cs: 'Výstřik do pusy', en: 'Cum in mouth', de: 'Sperma im Mund', uk: 'Кінчання в рот' } },
  { id: 'swallow', category: 'extra', translations: { cs: 'Polykání', en: 'Swallow', de: 'Schlucken', uk: 'Ковтання' } },
  { id: 'anal_girl', category: 'extra', translations: { cs: 'Dámský anál', en: 'Anal (girl)', de: 'Anal (Frau)', uk: 'Анал (дівчина)' } },
  { id: 'anal_man', category: 'extra', translations: { cs: 'Pánský anál', en: 'Anal (man)', de: 'Anal (Mann)', uk: 'Анал (чоловік)' } },
  { id: 'rimming_active', category: 'extra', translations: { cs: 'Rimming active', en: 'Rimming active', de: 'Rimming aktiv', uk: 'Римінг активний' } },
  { id: 'rimming_passive', category: 'extra', translations: { cs: 'Rimming passive', en: 'Rimming passive', de: 'Rimming passiv', uk: 'Римінг пасивний' } },
  { id: 'filming_face', category: 'extra', translations: { cs: 'Natáčení s obličejem', en: 'Filming with face', de: 'Filmen mit Gesicht', uk: 'Зйомка з обличчям' } },
  { id: 'filming_no_face', category: 'extra', translations: { cs: 'Natáčení bez obličeje', en: 'Filming without face', de: 'Filmen ohne Gesicht', uk: 'Зйомка без обличчя' } },
  { id: 'piss_active', category: 'extra', translations: { cs: 'Piss active', en: 'Piss active', de: 'Natursekt aktiv', uk: 'Золотий дощ активний' } },
  { id: 'piss_passive', category: 'extra', translations: { cs: 'Piss passive', en: 'Piss passive', de: 'Natursekt passiv', uk: 'Золотий дощ пасивний' } },
];

export function getBasicServices(): Service[] {
  return SERVICES.filter(s => s.category === 'basic');
}

export function getExtraServices(): Service[] {
  return SERVICES.filter(s => s.category === 'extra');
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find(s => s.id === id);
}

export function getServiceName(id: string, locale: string = 'cs'): string {
  const service = getServiceById(id);
  if (!service) return id;

  const lang = locale as 'cs' | 'en' | 'de' | 'uk';
  return service.translations[lang] || service.translations.cs;
}
