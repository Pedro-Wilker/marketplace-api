import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `https://seusite.gov.br/reset-password?token=${token}`;
    
    this.logger.log(`📧 E-MAIL ENVIADO PARA: ${email}`);
    this.logger.log(`🔗 LINK DE RESET: ${resetLink}`);
    
   }
}