/**
 * Telegram bot i18n — translation map + language detection.
 *
 * Languages: cs (Czech), en (English), uk (Ukrainian)
 * Default: cs
 */

import { db } from './db';

export type Lang = 'cs' | 'en' | 'uk';

// ---------------------------------------------------------------------------
// Translation helper
// ---------------------------------------------------------------------------

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const template = translations[lang]?.[key] ?? translations['cs'][key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)), template);
}

// ---------------------------------------------------------------------------
// Language detection & resolution
// ---------------------------------------------------------------------------

const CZ_CHARS = /[ěščřžýáíéúůďťň]/i;
const CYRILLIC = /[\u0400-\u04FF]/;

export function detectLanguage(telegramLangCode?: string, text?: string): Lang {
  // 1. Telegram language_code
  if (telegramLangCode) {
    const lc = telegramLangCode.toLowerCase();
    if (lc === 'cs' || lc.startsWith('cs-')) return 'cs';
    if (lc === 'uk' || lc === 'ua' || lc.startsWith('uk-') || lc.startsWith('ua-')) return 'uk';
    if (lc === 'ru' || lc.startsWith('ru-')) return 'uk'; // Russian speakers get Ukrainian UI
    // Everything else → en
    if (lc !== 'cs' && lc !== 'uk') return 'en';
  }

  // 2. Text heuristics
  if (text) {
    if (CYRILLIC.test(text)) return 'uk';
    if (CZ_CHARS.test(text)) return 'cs';
  }

  return 'cs';
}

/**
 * Resolve language for a client: DB preference > Telegram language_code > default cs
 */
export async function getClientLang(chatId: string): Promise<Lang> {
  try {
    const result = await db.execute({
      sql: 'SELECT language FROM booking_clients WHERE telegram_id = ? LIMIT 1',
      args: [chatId],
    });
    const lang = result.rows[0]?.language ? String(result.rows[0].language) : null;
    if (lang === 'cs' || lang === 'en' || lang === 'uk') return lang;
  } catch { /* no client record yet */ }
  return 'cs';
}

/**
 * Update client language preference in DB.
 */
export async function updateClientLang(chatId: string, lang: Lang): Promise<void> {
  try {
    await db.execute({
      sql: 'UPDATE booking_clients SET language = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
      args: [lang, chatId],
    });
  } catch { /* client may not exist yet */ }
}

// ---------------------------------------------------------------------------
// Translation map
// ---------------------------------------------------------------------------

const translations: Record<Lang, Record<string, string>> = {
  // ═══════════════════════════════════════════════════════════════════════
  // CZECH (default)
  // ═══════════════════════════════════════════════════════════════════════
  cs: {
    // errors
    'error.must_register': 'Pro rezervaci musis byt registrovany klient. Rekni mi sve jmeno a zaregistruji te.',
    'error.past_date': 'Nelze bookovat v minulosti. Dnes je {today}.',
    'error.girl_not_found': 'Divka nenalezena.',
    'error.no_slots': '{name} nema v {date} zadne volne casy.',

    // booking flow
    'flow.select_time': 'Vyber cas:',
    'flow.draft_expired': 'Tato rezervace vyprsela. Zacni prosim znovu.',
    'flow.no_time_for_program': 'V {time} uz neni dost casu na zadny program. Vyber jiny cas:',
    'flow.select_duration': 'Vyber delku programu:',
    'flow.confirm_question': 'Potvrdis?',
    'flow.slot_taken': 'Tento cas je bohužel uz obsazeny. Zacni prosim znovu.',
    'flow.slot_locked': 'Slot je prave obsazovany nekym jinym. Zkus jiny cas.',
    'flow.booking_pending': '\u{1F4CB} Rezervace {code} prijata!\n\n{summary}\n\nProtoze jsi u nas poprve, prosim <b>potvrd svuj prichod</b> kliknutim nize. Pokud nepotvrdis do 1h pred terminem, misto uvolnime.',
    'flow.booking_confirmed': '\u2705 Rezervace {code} potvrzena!\n\n{summary}\n\nTesime se na tebe!',
    'flow.cancelled': 'Rezervace zrusena. Napiste kdykoliv, pokud si budete chtit znovu zarezervovat \u{1F60A}',
    'flow.enter_promo': 'Napis promokod:',
    'flow.promo_invalid': '\u274C Kod <b>{code}</b> neni platny. Zkus jiny, nebo pokracuj bez slevy.',
    'flow.promo_used': '\u274C Kod <b>{code}</b> uz byl vyuzit. Zkus jiny.',
    'flow.promo_min_duration': '\u274C Kod <b>{code}</b> plati od {min} min. Tvuj program je {current} min.',
    'flow.slot_offer_at': 've',
    'flow.slot_offer_want': 'Chces?',
    'flow.no_girls_today': 'Dnes bohužel nikdo nemá volný termín \u{1F614} Nový rozvrh v pondělí.',
    'flow.who_choose': 'Koho si vybereš?',
    'flow.choose_girl': 'Vyber si slečnu',
    'flow.girl_not_found_short': 'Dívka nenalezena.',
    'flow.no_dates_this_week': '{name} nemá tento týden volné termíny \u{1F614}',
    'flow.select_day': 'Vyber den:',
    'flow.first_visit_name': 'Jsi tu poprvé! Napiš své jméno:',
    'flow.name_too_short': 'Napiš své jméno (alespoň 2 znaky):',
    'flow.welcome': 'Vítej, {name}! \u{1F60A}',
    'flow.cancelled_pre': 'Zrušeno. Napiš kdykoliv pro novou nabídku \u{1F60A}',
    'flow.no_more_slots': '{name} uz nema zadne volne casy. Zkus jiny den.',
    'flow.error_generic': 'Nastala chyba. Zkus to znovu.',
    'flow.booking_error': 'Omlouvam se, nastala chyba pri zpracovani rezervace. Zkus to prosim znovu.',

    // buttons
    'btn.cancel': '\u274C Zrusit',
    'btn.cancel_short': '\u274C Zrušit',
    'btn.back': '\u2B05 Zpet',
    'btn.confirm': '\u2705 Potvrdit',
    'btn.promo': '\u{1F3F7}\uFE0F Promokod',
    'btn.confirm_arrival': '\u2705 Potvrzuji prichod',
    'btn.cancel_booking': '\u274C Rusim',
    'btn.yes': '\u2705 Ano',
    'btn.no_next': '\u274C Ne, dalsi',
    'btn.yes_coming': '\u2705 Ano, prijdu',
    'btn.book': 'Rezervovat',
    'btn.notify_me': '\u{1F514} Upozornit me',

    // caption
    'caption.age': '{age} let',
    'caption.reviews': '{count} recenzí',
    'caption.escort': '\u{1F697} Escort',

    // status
    'status.confirmed': 'Potvrzena',
    'status.pending': 'Ceka na potvrzeni',
    'status.already_confirmed': 'uz je potvrzena',
    'status.not_active': 'uz neni aktivni',
    'status.booking_is': 'Tato rezervace {label}.',
    'confirm.success': 'potvrzeno! Tesime se na tebe!',
    'confirm.not_found': 'Rezervace nenalezena.',
    'cancel.client_done': 'Rezervace zrusena. Napis kdykoliv pro novou rezervaci \u{1F60A}',

    // waitlist
    'flow.interest_registered': '\u{1F514} Upozornime te, az se uvolni termin u {name} na {date}.',
    'flow.interest_already': 'Uz te mame v seznamu. Ozvu se, az se neco uvolni.',
    'flow.slot_freed_cancel': '\u{1F525} Uvolnil se termin!',

    // deep-link
    'deeplink.invalid': 'Odkaz neni platny. Napiste nam a pomuzeme vam.',
    'deeplink.already_linked': 'Tento ucet je jiz propojen s jinym Telegram chatem.',
    'deeplink.success_title': 'Vas ucet byl uspesne propojen!',
    'deeplink.welcome': 'Vitejte, {name}. Nyni muzete pres tento chat:',
    'deeplink.features': '  Vytvaret rezervace\n  Sledovat oblibene divky\n  Dostavat upozorneni na novy rozvrh',
    'deeplink.hint': 'Napiste <b>cokoliv</b> a nase operatorka vam pomuze.',
    'deeplink.girl_success': 'Propojeno!',
    'deeplink.girl_welcome': 'Vitej, {name}. Tvuj Telegram je propojen s tvym profilem.\nOd ted budes dostavat notifikace o novych rezervacich.',
    'deeplink.user_welcome': 'Vitejte, {name}. Vas Telegram je propojen s vasim uctem.\nOd ted budete dostavat notifikace o novych rezervacich a eskalacich.',
    'deeplink.admin_invalid': 'Odkaz neni platny. Kontaktujte spravce.',

    // notifications (client-facing)
    'notif.new_booking': '\u{1F4C5} <b>Nová rezervace</b>',
    'notif.booking_cancelled': '\u274C <b>Zrušená rezervace</b>',
    'notif.reminder_1h': '\u23F0 <b>Připomenutí — za 1 hodinu</b>',
    'notif.date_label': 'Datum: {date}',
    'notif.time_label': 'Čas: {start} — {end} ({duration} min)',
    'notif.status_confirmed': 'Status: Potvrzena',
    'notif.booking_id': 'Rezervace #{id}',
    'notif.reason': 'Důvod: {reason}',
    'notif.location': 'Pobočka: {location}',

    // cron
    'cron.confirm_title': '\u{1F514} <b>Potvrzeni rezervace</b>',
    'cron.confirm_body': 'Potvrd prosim svou rezervaci. Pokud nepotvrdis do 1h pred terminem, misto bude nabidnuto nekomu jinemu.',
    'cron.expired': '\u274C <b>{name}</b>, {date} v {time} — rezervace zrusena. Nepotvrdil/a jsi vcas. Napis kdykoliv pro novy termin \u{1F60A}',
    'cron.freed_slot': '\u{1F525} <b>Uvolnil se termin!</b>',
    'cron.freed_slot_cta': 'Chces rezervovat? Napis mi \u{1F60A}',
    'cron.antispam_check': '\u{1F4AC} Stale plati tvoje rezervace {code}? <b>{name}</b>, {date} v {time}',
    'cron.new_week': '\u{1F4C5} <b>Nový týden — nové termíny!</b>',
    'cron.girl_has_slots': '{name} má tento týden volné termíny.',
    'cron.book_hint': 'Napiš cokoliv a nabídnu ti volné termíny.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════
  en: {
    // errors
    'error.must_register': 'You must be a registered client to book. Tell me your name and I\'ll register you.',
    'error.past_date': 'Cannot book in the past. Today is {today}.',
    'error.girl_not_found': 'Girl not found.',
    'error.no_slots': '{name} has no available slots on {date}.',

    // booking flow
    'flow.select_time': 'Select time:',
    'flow.draft_expired': 'This reservation has expired. Please start again.',
    'flow.no_time_for_program': 'Not enough time at {time} for any program. Select another time:',
    'flow.select_duration': 'Select program duration:',
    'flow.confirm_question': 'Confirm?',
    'flow.slot_taken': 'This time slot is already taken. Please start again.',
    'flow.slot_locked': 'Slot is being booked by someone else. Try another time.',
    'flow.booking_pending': '\u{1F4CB} Booking {code} received!\n\n{summary}\n\nSince this is your first visit, please <b>confirm your arrival</b> by clicking below. If you don\'t confirm 1h before the appointment, the slot will be released.',
    'flow.booking_confirmed': '\u2705 Booking {code} confirmed!\n\n{summary}\n\nWe look forward to seeing you!',
    'flow.cancelled': 'Reservation cancelled. Write anytime to book again \u{1F60A}',
    'flow.enter_promo': 'Enter promo code:',
    'flow.promo_invalid': '\u274C Code <b>{code}</b> is not valid. Try another or continue without discount.',
    'flow.promo_used': '\u274C Code <b>{code}</b> has been used. Try another.',
    'flow.promo_min_duration': '\u274C Code <b>{code}</b> requires minimum {min} min. Your program is {current} min.',
    'flow.slot_offer_at': 'at',
    'flow.slot_offer_want': 'Want it?',
    'flow.no_girls_today': 'Unfortunately no one is available today \u{1F614} New schedule on Monday.',
    'flow.who_choose': 'Who do you choose?',
    'flow.choose_girl': 'Choose a girl',
    'flow.girl_not_found_short': 'Girl not found.',
    'flow.no_dates_this_week': '{name} has no available dates this week \u{1F614}',
    'flow.select_day': 'Select day:',
    'flow.first_visit_name': 'First time here! Write your name:',
    'flow.name_too_short': 'Write your name (at least 2 characters):',
    'flow.welcome': 'Welcome, {name}! \u{1F60A}',
    'flow.cancelled_pre': 'Cancelled. Write anytime for a new offer \u{1F60A}',
    'flow.no_more_slots': '{name} has no more available slots. Try another day.',
    'flow.error_generic': 'An error occurred. Try again.',
    'flow.booking_error': 'Sorry, an error occurred while processing your booking. Please try again.',

    // buttons
    'btn.cancel': '\u274C Cancel',
    'btn.cancel_short': '\u274C Cancel',
    'btn.back': '\u2B05 Back',
    'btn.confirm': '\u2705 Confirm',
    'btn.promo': '\u{1F3F7}\uFE0F Promo code',
    'btn.confirm_arrival': '\u2705 Confirming arrival',
    'btn.cancel_booking': '\u274C Cancel',
    'btn.yes': '\u2705 Yes',
    'btn.no_next': '\u274C No, next',
    'btn.yes_coming': '\u2705 Yes, I\'m coming',
    'btn.book': 'Book',
    'btn.notify_me': '\u{1F514} Notify me',

    // caption
    'caption.age': '{age} y.o.',
    'caption.reviews': '{count} reviews',
    'caption.escort': '\u{1F697} Escort',

    // status
    'status.confirmed': 'Confirmed',
    'status.pending': 'Awaiting confirmation',
    'status.already_confirmed': 'is already confirmed',
    'status.not_active': 'is no longer active',
    'status.booking_is': 'This reservation {label}.',
    'confirm.success': 'confirmed! We look forward to seeing you!',
    'confirm.not_found': 'Reservation not found.',
    'cancel.client_done': 'Reservation cancelled. Write anytime for a new booking \u{1F60A}',

    // waitlist
    'flow.interest_registered': '\u{1F514} We\'ll notify you when a slot opens for {name} on {date}.',
    'flow.interest_already': 'You\'re already on the list. I\'ll let you know when something opens up.',
    'flow.slot_freed_cancel': '\u{1F525} A slot has opened up!',

    // deep-link
    'deeplink.invalid': 'Invalid link. Contact us and we\'ll help you.',
    'deeplink.already_linked': 'This account is already linked to another Telegram chat.',
    'deeplink.success_title': 'Your account has been successfully linked!',
    'deeplink.welcome': 'Welcome, {name}. You can now use this chat to:',
    'deeplink.features': '  Make bookings\n  Follow favorite girls\n  Get new schedule notifications',
    'deeplink.hint': 'Write <b>anything</b> and our operator will help you.',
    'deeplink.girl_success': 'Connected!',
    'deeplink.girl_welcome': 'Welcome, {name}. Your Telegram is now linked to your profile.\nFrom now on you\'ll receive new booking notifications.',
    'deeplink.user_welcome': 'Welcome, {name}. Your Telegram is linked to your account.\nYou\'ll now receive notifications about new bookings and escalations.',
    'deeplink.admin_invalid': 'Invalid link. Contact the administrator.',

    // notifications (client-facing)
    'notif.new_booking': '\u{1F4C5} <b>New booking</b>',
    'notif.booking_cancelled': '\u274C <b>Cancelled booking</b>',
    'notif.reminder_1h': '\u23F0 <b>Reminder — in 1 hour</b>',
    'notif.date_label': 'Date: {date}',
    'notif.time_label': 'Time: {start} — {end} ({duration} min)',
    'notif.status_confirmed': 'Status: Confirmed',
    'notif.booking_id': 'Booking #{id}',
    'notif.reason': 'Reason: {reason}',
    'notif.location': 'Location: {location}',

    // cron
    'cron.confirm_title': '\u{1F514} <b>Booking confirmation</b>',
    'cron.confirm_body': 'Please confirm your booking. If you don\'t confirm 1h before the appointment, the slot will be offered to someone else.',
    'cron.expired': '\u274C <b>{name}</b>, {date} at {time} — booking cancelled. You didn\'t confirm in time. Write anytime for a new slot \u{1F60A}',
    'cron.freed_slot': '\u{1F525} <b>A slot has opened up!</b>',
    'cron.freed_slot_cta': 'Want to book? Write me \u{1F60A}',
    'cron.antispam_check': '\u{1F4AC} Is your booking {code} still valid? <b>{name}</b>, {date} at {time}',
    'cron.new_week': '\u{1F4C5} <b>New week — new slots!</b>',
    'cron.girl_has_slots': '{name} has available slots this week.',
    'cron.book_hint': 'Write anything and I\'ll show you available slots.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UKRAINIAN
  // ═══════════════════════════════════════════════════════════════════════
  uk: {
    // errors
    'error.must_register': 'Щоб забронювати, потрібна реєстрація. Напишіть своє ім\'я і я вас зареєструю.',
    'error.past_date': 'Не можна бронювати в минулому. Сьогодні {today}.',
    'error.girl_not_found': 'Дівчину не знайдено.',
    'error.no_slots': '{name} не має вільних слотів на {date}.',

    // booking flow
    'flow.select_time': 'Оберіть час:',
    'flow.draft_expired': 'Це бронювання закінчилось. Почніть, будь ласка, знову.',
    'flow.no_time_for_program': 'О {time} вже недостатньо часу для програми. Оберіть інший час:',
    'flow.select_duration': 'Оберіть тривалість програми:',
    'flow.confirm_question': 'Підтвердити?',
    'flow.slot_taken': 'Цей час вже зайнятий. Почніть, будь ласка, знову.',
    'flow.slot_locked': 'Цей слот бронює хтось інший. Спробуйте інший час.',
    'flow.booking_pending': '\u{1F4CB} Бронювання {code} прийнято!\n\n{summary}\n\nОскільки це ваш перший візит, <b>підтвердіть прихід</b> натисканням кнопки нижче. Якщо не підтвердите за 1 год до початку, місце буде звільнено.',
    'flow.booking_confirmed': '\u2705 Бронювання {code} підтверджено!\n\n{summary}\n\nЧекаємо на вас!',
    'flow.cancelled': 'Бронювання скасовано. Напишіть будь-коли для нового бронювання \u{1F60A}',
    'flow.enter_promo': 'Введіть промокод:',
    'flow.promo_invalid': '\u274C Код <b>{code}</b> недійсний. Спробуйте інший або продовжуйте без знижки.',
    'flow.promo_used': '\u274C Код <b>{code}</b> вже використаний. Спробуйте інший.',
    'flow.promo_min_duration': '\u274C Код <b>{code}</b> діє від {min} хв. Ваша програма {current} хв.',
    'flow.slot_offer_at': 'о',
    'flow.slot_offer_want': 'Хочеш?',
    'flow.no_girls_today': 'На жаль, сьогодні ніхто не доступний \u{1F614} Новий розклад у понеділок.',
    'flow.who_choose': 'Кого оберете?',
    'flow.choose_girl': 'Обери дівчину',
    'flow.girl_not_found_short': 'Дівчину не знайдено.',
    'flow.no_dates_this_week': '{name} не має вільних дат цього тижня \u{1F614}',
    'flow.select_day': 'Оберіть день:',
    'flow.first_visit_name': 'Ви тут вперше! Напишіть своє ім\'я:',
    'flow.name_too_short': 'Напишіть своє ім\'я (мінімум 2 символи):',
    'flow.welcome': 'Ласкаво просимо, {name}! \u{1F60A}',
    'flow.cancelled_pre': 'Скасовано. Напишіть будь-коли для нової пропозиції \u{1F60A}',
    'flow.no_more_slots': '{name} вже не має вільних слотів. Спробуйте інший день.',
    'flow.error_generic': 'Сталася помилка. Спробуйте ще раз.',
    'flow.booking_error': 'Вибачте, сталася помилка при обробці бронювання. Спробуйте ще раз.',

    // buttons
    'btn.cancel': '\u274C Скасувати',
    'btn.cancel_short': '\u274C Скасувати',
    'btn.back': '\u2B05 Назад',
    'btn.confirm': '\u2705 Підтвердити',
    'btn.promo': '\u{1F3F7}\uFE0F Промокод',
    'btn.confirm_arrival': '\u2705 Підтверджую прихід',
    'btn.cancel_booking': '\u274C Скасувати',
    'btn.yes': '\u2705 Так',
    'btn.no_next': '\u274C Ні, наступний',
    'btn.yes_coming': '\u2705 Так, прийду',
    'btn.book': '\u0417\u0430\u0431\u0440\u043E\u043D\u044E\u0432\u0430\u0442\u0438',
    'btn.notify_me': '\u{1F514} \u0421\u043F\u043E\u0432\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0435\u043D\u0435',

    // caption
    'caption.age': '{age} років',
    'caption.reviews': '{count} відгуків',
    'caption.escort': '\u{1F697} Ескорт',

    // status
    'status.confirmed': 'Підтверджено',
    'status.pending': 'Очікує підтвердження',
    'status.already_confirmed': 'вже підтверджено',
    'status.not_active': 'вже не активне',
    'status.booking_is': 'Це бронювання {label}.',
    'confirm.success': 'підтверджено! Чекаємо на вас!',
    'confirm.not_found': 'Бронювання не знайдено.',
    'cancel.client_done': 'Бронювання скасовано. Напишіть будь-коли для нового бронювання \u{1F60A}',

    // waitlist
    'flow.interest_registered': '\u{1F514} Ми повідомимо вас, коли звільниться слот у {name} на {date}.',
    'flow.interest_already': 'Ви вже в списку. Повідомимо вас.',
    'flow.slot_freed_cancel': '\u{1F525} Звільнився час!',

    // deep-link
    'deeplink.invalid': 'Посилання недійсне. Напишіть нам і ми допоможемо.',
    'deeplink.already_linked': 'Цей акаунт вже прив\'язаний до іншого Telegram чату.',
    'deeplink.success_title': 'Ваш акаунт успішно прив\'язано!',
    'deeplink.welcome': 'Вітаємо, {name}. Тепер ви можете через цей чат:',
    'deeplink.features': '  Створювати бронювання\n  Стежити за улюбленими дівчатами\n  Отримувати сповіщення про новий розклад',
    'deeplink.hint': 'Напишіть <b>будь-що</b> і наш оператор вам допоможе.',
    'deeplink.girl_success': 'Підключено!',
    'deeplink.girl_welcome': 'Вітаємо, {name}. Ваш Telegram прив\'язаний до вашого профілю.\nВідтепер ви отримуватимете сповіщення про нові бронювання.',
    'deeplink.user_welcome': 'Вітаємо, {name}. Ваш Telegram прив\'язаний до вашого акаунту.\nВідтепер ви отримуватимете сповіщення про нові бронювання та ескалації.',
    'deeplink.admin_invalid': 'Посилання недійсне. Зверніться до адміністратора.',

    // notifications (client-facing)
    'notif.new_booking': '\u{1F4C5} <b>Нове бронювання</b>',
    'notif.booking_cancelled': '\u274C <b>Скасоване бронювання</b>',
    'notif.reminder_1h': '\u23F0 <b>Нагадування — за 1 годину</b>',
    'notif.date_label': 'Дата: {date}',
    'notif.time_label': 'Час: {start} — {end} ({duration} хв)',
    'notif.status_confirmed': 'Статус: Підтверджено',
    'notif.booking_id': 'Бронювання #{id}',
    'notif.reason': 'Причина: {reason}',
    'notif.location': 'Локація: {location}',

    // cron
    'cron.confirm_title': '\u{1F514} <b>Підтвердження бронювання</b>',
    'cron.confirm_body': 'Підтвердіть, будь ласка, ваше бронювання. Якщо не підтвердите за 1 год до початку, місце буде запропоновано комусь іншому.',
    'cron.expired': '\u274C <b>{name}</b>, {date} о {time} — бронювання скасовано. Ви не підтвердили вчасно. Напишіть будь-коли для нового часу \u{1F60A}',
    'cron.freed_slot': '\u{1F525} <b>Звільнився час!</b>',
    'cron.freed_slot_cta': 'Хочете забронювати? Напишіть мені \u{1F60A}',
    'cron.antispam_check': '\u{1F4AC} Ваше бронювання {code} ще актуальне? <b>{name}</b>, {date} о {time}',
    'cron.new_week': '\u{1F4C5} <b>Новий тиждень — нові слоти!</b>',
    'cron.girl_has_slots': '{name} має вільні слоти цього тижня.',
    'cron.book_hint': 'Напишіть будь-що і я покажу вільні слоти.',
  },
};
