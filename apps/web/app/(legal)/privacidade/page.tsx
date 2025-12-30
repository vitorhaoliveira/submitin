import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade da plataforma Form Builder",
};

export default function PrivacidadePage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p className="lead">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <p>
        Esta Política de Privacidade descreve como o Form Builder coleta, usa e
        protege suas informações pessoais quando você usa nosso serviço.
      </p>

      <h2>1. Informações que Coletamos</h2>

      <h3>1.1 Informações da Conta</h3>
      <p>Quando você cria uma conta, coletamos:</p>
      <ul>
        <li>Endereço de email</li>
        <li>Data de criação da conta</li>
      </ul>

      <h3>1.2 Dados dos Formulários</h3>
      <p>Quando você usa o serviço, armazenamos:</p>
      <ul>
        <li>Formulários que você cria (nome, descrição, campos)</li>
        <li>Respostas recebidas nos seus formulários</li>
        <li>Configurações dos formulários (email de notificação, webhooks)</li>
      </ul>

      <h3>1.3 Dados de Uso</h3>
      <p>Coletamos automaticamente:</p>
      <ul>
        <li>Endereço IP (para segurança e rate limiting)</li>
        <li>Data e hora de acesso</li>
        <li>Páginas visitadas</li>
      </ul>

      <h2>2. Como Usamos suas Informações</h2>
      <p>Usamos suas informações para:</p>
      <ul>
        <li>Fornecer e manter o serviço</li>
        <li>Autenticar seu acesso via Magic Link</li>
        <li>Enviar notificações de novas respostas (se configurado)</li>
        <li>Proteger contra spam e abusos</li>
        <li>Melhorar o serviço</li>
        <li>Comunicar atualizações importantes</li>
      </ul>

      <h2>3. Compartilhamento de Dados</h2>
      <p>
        <strong>Não vendemos suas informações pessoais.</strong> Podemos
        compartilhar dados apenas nas seguintes situações:
      </p>
      <ul>
        <li>
          <strong>Prestadores de serviço:</strong> Usamos serviços terceiros
          para operar a plataforma (hospedagem, banco de dados, envio de
          emails). Estes prestadores têm acesso limitado aos dados necessários
          para suas funções.
        </li>
        <li>
          <strong>Requisitos legais:</strong> Podemos divulgar informações se
          exigido por lei ou ordem judicial.
        </li>
        <li>
          <strong>Webhooks:</strong> Se você configurar um webhook, os dados das
          respostas serão enviados para a URL que você especificar.
        </li>
      </ul>

      <h2>4. Segurança dos Dados</h2>
      <p>Implementamos medidas de segurança para proteger seus dados:</p>
      <ul>
        <li>Criptografia em trânsito (HTTPS)</li>
        <li>Autenticação segura via Magic Link</li>
        <li>Rate limiting para prevenir abusos</li>
        <li>Sanitização de inputs para prevenir ataques</li>
        <li>Acesso restrito ao banco de dados</li>
      </ul>

      <h2>5. Retenção de Dados</h2>
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir
        sua conta, seus dados serão removidos permanentemente em até 30 dias.
      </p>
      <p>
        Os formulários e respostas são mantidos até que você os exclua
        manualmente ou encerre sua conta.
      </p>

      <h2>6. Seus Direitos</h2>
      <p>Você tem direito a:</p>
      <ul>
        <li>
          <strong>Acesso:</strong> Solicitar uma cópia dos seus dados
        </li>
        <li>
          <strong>Correção:</strong> Corrigir dados imprecisos
        </li>
        <li>
          <strong>Exclusão:</strong> Solicitar a exclusão dos seus dados
        </li>
        <li>
          <strong>Portabilidade:</strong> Exportar seus dados (via CSV)
        </li>
        <li>
          <strong>Objeção:</strong> Opor-se ao processamento dos seus dados
        </li>
      </ul>

      <h2>7. Cookies</h2>
      <p>Usamos cookies essenciais para:</p>
      <ul>
        <li>Manter sua sessão de login</li>
        <li>Proteger contra ataques CSRF</li>
      </ul>
      <p>Não usamos cookies de rastreamento ou publicidade.</p>

      <h2>8. Dados de Terceiros</h2>
      <p>
        Quando você coleta dados através dos seus formulários, você é o
        controlador desses dados. É sua responsabilidade:
      </p>
      <ul>
        <li>Informar aos respondentes como seus dados serão usados</li>
        <li>Obter consentimento adequado quando necessário</li>
        <li>Cumprir as leis de proteção de dados aplicáveis (LGPD, GDPR)</li>
      </ul>

      <h2>9. Menores de Idade</h2>
      <p>
        O Form Builder não é destinado a menores de 18 anos. Não coletamos
        intencionalmente dados de menores. Se você acredita que coletamos dados
        de um menor, entre em contato conosco.
      </p>

      <h2>10. Alterações nesta Política</h2>
      <p>
        Podemos atualizar esta política periodicamente. Alterações
        significativas serão comunicadas por email ou através do serviço. O uso
        continuado do serviço após as alterações constitui aceitação da nova
        política.
      </p>

      <h2>11. Contato</h2>
      <p>
        Para exercer seus direitos ou esclarecer dúvidas sobre esta política,
        entre em contato através do email disponível em nosso site.
      </p>

      <h2>12. Base Legal (LGPD)</h2>
      <p>
        Processamos seus dados com base nas seguintes bases legais da Lei Geral
        de Proteção de Dados (LGPD):
      </p>
      <ul>
        <li>
          <strong>Execução de contrato:</strong> Para fornecer o serviço que
          você solicitou
        </li>
        <li>
          <strong>Consentimento:</strong> Para enviar comunicações de marketing
          (se aplicável)
        </li>
        <li>
          <strong>Interesse legítimo:</strong> Para melhorar o serviço e
          prevenir fraudes
        </li>
        <li>
          <strong>Obrigação legal:</strong> Para cumprir requisitos legais
        </li>
      </ul>
    </>
  );
}

