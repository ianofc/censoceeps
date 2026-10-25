/**
 * HEIMDALL - Middleware de Segurança, Governança e LGPD
 * 
 * Responsabilidades:
 * 1. Mascaramento dinâmico de PII (CPF, telefone, e-mail, nomes para dados públicos)
 * 2. Validação e saneamento de entradas para evitar injeções
 * 3. Rate limiting client-side para evitar submissões abusivas
 * 4. Verificação de permissões RBAC para turmas e dados restritos
 */

export interface HeimdallUserContext {
  role?: 'admin' | 'gestor' | 'professor' | 'aluno' | 'publico';
  turmasPermitidas?: string[];
  userId?: string;
}

export class HeimdallSecurityService {
  private static submissionTimestamps: number[] = [];
  private static MAX_SUBMISSIONS_PER_MINUTE = 5;

  /**
   * Mascara CPF mantendo apenas formato seguro para exibição (ex: 123.***.***-00)
   */
  public static maskCPF(cpf?: string | null): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return '***.***.***-**';
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
  }

  /**
   * Mascara telefone para proteção de contato (ex: (75) 9****-1234)
   */
  public static maskPhone(phone?: string | null): string {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return '(**) *****-****';
    const ddd = clean.substring(0, 2);
    const last4 = clean.slice(-4);
    return `(${ddd}) 9****-${last4}`;
  }

  /**
   * Mascara e-mail preservando apenas domínio e primeira letra (ex: j***@escola.ba.gov.br)
   */
  public static maskEmail(email?: string | null): string {
    if (!email || !email.includes('@')) return '***@***.com';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  /**
   * Mascara nome para exibição pública quando não há consentimento total (ex: João S.)
   */
  public static maskPublicName(name?: string | null): string {
    if (!name) return 'Anônimo';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const initial = parts[parts.length - 1][0]?.toUpperCase() || '';
    return `${first} ${initial}.`;
  }

  /**
   * Sanitiza strings abertas removendo tags perigosas (anti-XSS simples)
   */
  public static sanitizeInput(text?: string | null): string {
    if (!text) return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Rate limiting em memória: impede disparos repetitivos acidentais ou maliciosos
   */
  public static checkRateLimit(): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Limpa registros antigos
    this.submissionTimestamps = this.submissionTimestamps.filter(t => t > oneMinuteAgo);

    if (this.submissionTimestamps.length >= this.MAX_SUBMISSIONS_PER_MINUTE) {
      const oldest = this.submissionTimestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + 60000 - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    this.submissionTimestamps.push(now);
    return { allowed: true };
  }

  /**
   * Valida se o usuário tem permissão de visualizar a turma especificada
   */
  public static canAccessTurma(context: HeimdallUserContext, turma: string): boolean {
    if (!context || !context.role) return false;
    if (context.role === 'admin' || context.role === 'gestor') return true;
    if (context.role === 'professor') {
      if (!context.turmasPermitidas || context.turmasPermitidas.length === 0) return true; // se não especificado, permissão padrão docente
      return context.turmasPermitidas.some(t => t.toLowerCase() === turma.toLowerCase());
    }
    return false;
  }
}
