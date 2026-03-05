import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import i18next from 'i18next';
import settings from './settings.js';

export function mountCookieConsent(policyUrl) {
  // multidomain for that cookie with .l-a.site
  const cookieDomain = document.location.host !== 'localhost:3333'
    ? '.' + settings.mainDomain
    : undefined;

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
    },
    cookie: {
      domain: cookieDomain,
      path: '/',
      sameSite: 'Lax'
    }
  });
}

