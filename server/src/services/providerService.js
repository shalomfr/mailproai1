class ProviderService {
  static providers = {
    'gmail.com': {
      name: 'Gmail',
      type: 'gmail',
      logo: '/images/providers/gmail.png',
      imap: {
        server: 'imap.gmail.com',
        port: 993,
        ssl: true,
        auth: 'oauth2'
      },
      smtp: {
        server: 'smtp.gmail.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'oauth2'
      },
      oauth2: true,
      documentation: 'https://support.google.com/mail/answer/7126229'
    },
    'outlook.com': {
      name: 'Outlook',
      type: 'outlook',
      logo: '/images/providers/outlook.png',
      imap: {
        server: 'outlook.office365.com',
        port: 993,
        ssl: true,
        auth: 'oauth2'
      },
      smtp: {
        server: 'smtp.office365.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'oauth2'
      },
      oauth2: true,
      documentation: 'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353'
    },
    'hotmail.com': {
      name: 'Hotmail',
      type: 'outlook',
      logo: '/images/providers/outlook.png',
      imap: {
        server: 'outlook.office365.com',
        port: 993,
        ssl: true,
        auth: 'normal'
      },
      smtp: {
        server: 'smtp.office365.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'normal'
      },
      oauth2: false
    },
    'yahoo.com': {
      name: 'Yahoo Mail',
      type: 'yahoo',
      logo: '/images/providers/yahoo.png',
      imap: {
        server: 'imap.mail.yahoo.com',
        port: 993,
        ssl: true,
        auth: 'normal'
      },
      smtp: {
        server: 'smtp.mail.yahoo.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'normal'
      },
      oauth2: false,
      documentation: 'https://help.yahoo.com/kb/SLN4724.html'
    },
    'icloud.com': {
      name: 'iCloud Mail',
      type: 'icloud',
      logo: '/images/providers/icloud.png',
      imap: {
        server: 'imap.mail.me.com',
        port: 993,
        ssl: true,
        auth: 'normal'
      },
      smtp: {
        server: 'smtp.mail.me.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'normal'
      },
      oauth2: false,
      documentation: 'https://support.apple.com/en-us/HT202304'
    },
    'aol.com': {
      name: 'AOL Mail',
      type: 'aol',
      logo: '/images/providers/aol.png',
      imap: {
        server: 'imap.aol.com',
        port: 993,
        ssl: true,
        auth: 'normal'
      },
      smtp: {
        server: 'smtp.aol.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'normal'
      },
      oauth2: false
    },
    'protonmail.com': {
      name: 'ProtonMail',
      type: 'protonmail',
      logo: '/images/providers/protonmail.png',
      imap: {
        server: '127.0.0.1',
        port: 1143,
        ssl: false,
        auth: 'normal'
      },
      smtp: {
        server: '127.0.0.1',
        port: 1025,
        ssl: false,
        tls: false,
        auth: 'normal'
      },
      oauth2: false,
      note: 'דרוש ProtonMail Bridge',
      documentation: 'https://protonmail.com/bridge'
    },
    'zoho.com': {
      name: 'Zoho Mail',
      type: 'zoho',
      logo: '/images/providers/zoho.png',
      imap: {
        server: 'imap.zoho.com',
        port: 993,
        ssl: true,
        auth: 'normal'
      },
      smtp: {
        server: 'smtp.zoho.com',
        port: 587,
        ssl: false,
        tls: true,
        auth: 'normal'
      },
      oauth2: false
    }
  };

  static getProvider(domain) {
    const normalizedDomain = domain.toLowerCase();
    return this.providers[normalizedDomain] || null;
  }

  static detectProviderFromEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return null;
    }

    const provider = this.getProvider(domain);
    if (provider) {
      return {
        domain,
        ...provider
      };
    }

    return null;
  }

  static getAllProviders() {
    return Object.entries(this.providers).map(([domain, config]) => ({
      domain,
      ...config
    }));
  }

  static getPopularProviders() {
    const popular = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    return popular.map(domain => ({
      domain,
      ...this.providers[domain]
    }));
  }

  static getSuggestions(partialEmail) {
    if (!partialEmail || typeof partialEmail !== 'string') {
      return [];
    }

    // אם אין @ עדיין, מחזיר רשימת ספקים פופולריים
    if (!partialEmail.includes('@')) {
      return this.getPopularProviders().map(provider => ({
        email: `${partialEmail}@${provider.domain}`,
        provider: provider.name,
        type: provider.type,
        local: partialEmail,
        domain: provider.domain
      }));
    }

    const [localPart, domainPart] = partialEmail.split('@');
    const suggestions = [];

    // מצא התאמות של דומיין
    Object.entries(this.providers).forEach(([domain, config]) => {
      if (domain.startsWith(domainPart.toLowerCase())) {
        suggestions.push({
          email: `${localPart}@${domain}`,
          provider: config.name,
          type: config.type,
          local: localPart,
          domain: domain,
          logo: config.logo
        });
      }
    });

    // מיין לפי פופולריות
    const popularOrder = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    suggestions.sort((a, b) => {
      const aIndex = popularOrder.indexOf(a.domain);
      const bIndex = popularOrder.indexOf(b.domain);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    return suggestions.slice(0, 5); // מגביל ל-5 הצעות
  }

  static validateEmailSettings(provider, settings) {
    const errors = [];

    if (!settings.imap) {
      errors.push('הגדרות IMAP חסרות');
    } else {
      if (!settings.imap.server) errors.push('שרת IMAP חסר');
      if (!settings.imap.port || settings.imap.port < 1 || settings.imap.port > 65535) {
        errors.push('פורט IMAP לא תקין');
      }
    }

    if (!settings.smtp) {
      errors.push('הגדרות SMTP חסרות');
    } else {
      if (!settings.smtp.server) errors.push('שרת SMTP חסר');
      if (!settings.smtp.port || settings.smtp.port < 1 || settings.smtp.port > 65535) {
        errors.push('פורט SMTP לא תקין');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static getDefaultSettings(provider) {
    const providerConfig = this.getProvider(provider);
    if (!providerConfig) {
      return {
        imap: {
          server: '',
          port: 993,
          ssl: true,
          auth: 'normal'
        },
        smtp: {
          server: '',
          port: 587,
          ssl: false,
          tls: true,
          auth: 'normal'
        }
      };
    }

    return {
      imap: { ...providerConfig.imap },
      smtp: { ...providerConfig.smtp }
    };
  }
}

module.exports = ProviderService; 