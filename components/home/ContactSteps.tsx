import { getTranslations } from 'next-intl/server';

interface ContactStepsProps {
  locale: string;
}

export default async function ContactSteps({ locale }: ContactStepsProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.contact' });

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">{t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="booking-steps">
          <div className="booking-step">
            <div className="booking-step-num">01</div>
            <div className="booking-step-title">{t('step1.title')}</div>
            <div className="booking-step-text">{t('step1.text')}</div>
          </div>
          <div className="booking-step">
            <div className="booking-step-num">02</div>
            <div className="booking-step-title">{t('step2.title')}</div>
            <div className="booking-step-text">{t('step2.text')}</div>
          </div>
          <div className="booking-step">
            <div className="booking-step-num">03</div>
            <div className="booking-step-title">{t('step3.title')}</div>
            <div className="booking-step-text">{t('step3.text')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
