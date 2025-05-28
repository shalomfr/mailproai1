const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');

class EmailTestService {
  static async testConnection(config) {
    const results = {
      success: false,
      imap: {
        connected: false,
        error: null,
        details: {}
      },
      smtp: {
        connected: false,
        error: null,
        details: {}
      },
      overall: {
        status: 'testing',
        message: '',
        timestamp: new Date().toISOString()
      }
    };

    // בדיקת IMAP
    try {
      const imapResult = await this.testIMAPConnection(config);
      results.imap = imapResult;
    } catch (error) {
      results.imap = {
        connected: false,
        error: error.message,
        details: {}
      };
    }

    // בדיקת SMTP
    try {
      const smtpResult = await this.testSMTPConnection(config);
      results.smtp = smtpResult;
    } catch (error) {
      results.smtp = {
        connected: false,
        error: error.message,
        details: {}
      };
    }

    // סטטוס כללי
    results.success = results.imap.connected && results.smtp.connected;
    
    if (results.success) {
      results.overall.status = 'connected';
      results.overall.message = 'חיבור הצליח לכל השרתים';
    } else if (results.imap.connected || results.smtp.connected) {
      results.overall.status = 'partial';
      results.overall.message = 'חיבור חלקי - חלק מהשרתים לא זמינים';
    } else {
      results.overall.status = 'failed';
      results.overall.message = 'החיבור נכשל';
    }

    return results;
  }

  static async testIMAPConnection(config) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('IMAP connection timeout (30 seconds)'));
      }, 30000);

      const client = new ImapFlow({
        host: config.settings.imap.server,
        port: config.settings.imap.port,
        secure: config.settings.imap.ssl,
        auth: {
          user: config.email,
          pass: config.password
        },
        logger: false
      });

      client.connect()
        .then(async () => {
          try {
            // בדיקת יכולות השרת
            const capabilities = client.serverInfo;
            
            // רשימת תיקיות
            const mailboxes = await client.list();
            
            // סגירת החיבור
            await client.logout();
            
            clearTimeout(timeout);
            resolve({
              connected: true,
              error: null,
              details: {
                server: capabilities.name || 'Unknown',
                version: capabilities.version || 'Unknown',
                capabilities: capabilities.capabilities || [],
                mailboxCount: mailboxes.length,
                greeting: capabilities.greeting || ''
              }
            });
          } catch (error) {
            clearTimeout(timeout);
            await client.logout().catch(() => {});
            reject(error);
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(new Error(`IMAP connection failed: ${error.message}`));
        });
    });
  }

  static async testSMTPConnection(config) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SMTP connection timeout (30 seconds)'));
      }, 30000);

      const transporter = nodemailer.createTransporter({
        host: config.settings.smtp.server,
        port: config.settings.smtp.port,
        secure: config.settings.smtp.ssl,
        requireTLS: config.settings.smtp.tls,
        auth: {
          user: config.email,
          pass: config.password
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      });

      transporter.verify((error, success) => {
        clearTimeout(timeout);
        
        if (error) {
          reject(new Error(`SMTP connection failed: ${error.message}`));
        } else {
          resolve({
            connected: true,
            error: null,
            details: {
              host: config.settings.smtp.server,
              port: config.settings.smtp.port,
              secure: config.settings.smtp.ssl,
              tls: config.settings.smtp.tls,
              authSupported: true
            }
          });
        }
      });
    });
  }

  static async testQuickConnection(email, password, provider) {
    // בדיקה מהירה עם הגדרות ברירת מחדל של הספק
    const ProviderService = require('./providerService');
    const providerConfig = ProviderService.detectProviderFromEmail(email);
    
    if (!providerConfig) {
      throw new Error('ספק מייל לא מזוהה');
    }

    const config = {
      email,
      password,
      settings: {
        imap: providerConfig.imap,
        smtp: providerConfig.smtp
      }
    };

    return await this.testConnection(config);
  }

  static getDiagnosticInfo(error) {
    const diagnostics = {
      type: 'unknown',
      category: 'connection',
      suggestions: [],
      severity: 'error'
    };

    const errorMessage = error.toLowerCase();

    // זיהוי סוגי שגיאות נפוצות
    if (errorMessage.includes('timeout')) {
      diagnostics.type = 'timeout';
      diagnostics.suggestions = [
        'בדוק את חיבור האינטרנט',
        'נסה פורט חלופי',
        'בדוק חומת אש או פרוקסי'
      ];
    } else if (errorMessage.includes('authentication') || errorMessage.includes('login')) {
      diagnostics.type = 'authentication';
      diagnostics.category = 'credentials';
      diagnostics.suggestions = [
        'בדוק שם משתמש וסיסמה',
        'וודא שהחשבון לא נחסם',
        'בדוק הגדרות אבטחה של החשבון',
        'ייתכן שנדרש App Password'
      ];
    } else if (errorMessage.includes('certificate') || errorMessage.includes('ssl') || errorMessage.includes('tls')) {
      diagnostics.type = 'certificate';
      diagnostics.category = 'security';
      diagnostics.suggestions = [
        'בדוק הגדרות SSL/TLS',
        'נסה ללא SSL',
        'עדכן תעודות אבטחה'
      ];
    } else if (errorMessage.includes('host') || errorMessage.includes('resolve')) {
      diagnostics.type = 'dns';
      diagnostics.category = 'network';
      diagnostics.suggestions = [
        'בדוק כתובת השרת',
        'בדוק הגדרות DNS',
        'נסה כתובת IP ישירה'
      ];
    } else if (errorMessage.includes('port') || errorMessage.includes('refused')) {
      diagnostics.type = 'port';
      diagnostics.category = 'network';
      diagnostics.suggestions = [
        'בדוק מספר פורט',
        'נסה פורט חלופי',
        'בדוק חומת אש'
      ];
    }

    return diagnostics;
  }

  static async runFullDiagnostic(config) {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      email: config.email,
      provider: config.provider || 'unknown',
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0
      },
      recommendations: []
    };

    // בדיקות בסיסיות
    const basicTests = [
      {
        name: 'Email Format Validation',
        test: () => this.validateEmailFormat(config.email)
      },
      {
        name: 'IMAP Settings Validation',
        test: () => this.validateIMAPSettings(config.settings.imap)
      },
      {
        name: 'SMTP Settings Validation',
        test: () => this.validateSMTPSettings(config.settings.smtp)
      }
    ];

    // הרצת בדיקות בסיסיות
    for (const test of basicTests) {
      try {
        const result = await test.test();
        diagnostic.tests.push({
          name: test.name,
          status: result.valid ? 'passed' : 'failed',
          message: result.message || 'OK',
          details: result.details || {}
        });

        if (result.valid) {
          diagnostic.summary.passed++;
        } else {
          diagnostic.summary.failed++;
        }
      } catch (error) {
        diagnostic.tests.push({
          name: test.name,
          status: 'error',
          message: error.message,
          details: {}
        });
        diagnostic.summary.failed++;
      }
    }

    // בדיקת חיבור מלאה
    try {
      const connectionResult = await this.testConnection(config);
      diagnostic.tests.push({
        name: 'Full Connection Test',
        status: connectionResult.success ? 'passed' : 'failed',
        message: connectionResult.overall.message,
        details: connectionResult
      });

      if (connectionResult.success) {
        diagnostic.summary.passed++;
      } else {
        diagnostic.summary.failed++;
      }
    } catch (error) {
      diagnostic.tests.push({
        name: 'Full Connection Test',
        status: 'error',
        message: error.message,
        details: {}
      });
      diagnostic.summary.failed++;
    }

    // המלצות
    if (diagnostic.summary.failed > 0) {
      diagnostic.recommendations.push('בדוק את הגדרות החשבון אצל ספק המייל');
      diagnostic.recommendations.push('וודא שהאפליקציה מורשית לגשת לחשבון');
    }

    return diagnostic;
  }

  static validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(email),
      message: emailRegex.test(email) ? 'כתובת מייל תקינה' : 'כתובת מייל לא תקינה'
    };
  }

  static validateIMAPSettings(settings) {
    const errors = [];
    
    if (!settings.server) errors.push('שרת IMAP חסר');
    if (!settings.port || settings.port < 1 || settings.port > 65535) {
      errors.push('פורט IMAP לא תקין');
    }

    return {
      valid: errors.length === 0,
      message: errors.length === 0 ? 'הגדרות IMAP תקינות' : errors.join(', '),
      details: { errors }
    };
  }

  static validateSMTPSettings(settings) {
    const errors = [];
    
    if (!settings.server) errors.push('שרת SMTP חסר');
    if (!settings.port || settings.port < 1 || settings.port > 65535) {
      errors.push('פורט SMTP לא תקין');
    }

    return {
      valid: errors.length === 0,
      message: errors.length === 0 ? 'הגדרות SMTP תקינות' : errors.join(', '),
      details: { errors }
    };
  }
}

module.exports = EmailTestService; 