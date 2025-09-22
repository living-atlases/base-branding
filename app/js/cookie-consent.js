import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import i18next from 'i18next';

export function mountCookieConsent(policyUrl) {
  CookieConsent.run({
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {}
    },
    language: {
      default: i18next.resolvedLanguage || 'en',
      translations: {
        en: {
          consentModal: {
            title: i18next.t('cookie_policy_btn'),
            description: i18next.t('cookie_message'),
            acceptAllBtn: i18next.t('cookie_accept_btn'),
            footer: `<a href="${policyUrl}">${i18next.t('cookie_policy_btn')}</a>`
          }
        },
        es: {
          consentModal: {
            title: i18next.t('cookie_policy_btn'),
            description: i18next.t('cookie_message'),
            acceptAllBtn: i18next.t('cookie_accept_btn'),
            footer: `<a href="${policyUrl}">${i18next.t('cookie_policy_btn')}</a>`
          }
        }
      }
    }
  });
}

