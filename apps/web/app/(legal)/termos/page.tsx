import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso da plataforma Form Builder",
};

export default function TermosPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p className="lead">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao acessar e usar o Form Builder, você concorda em cumprir e estar
        vinculado a estes Termos de Uso. Se você não concordar com qualquer
        parte destes termos, não poderá acessar o serviço.
      </p>

      <h2>2. Descrição do Serviço</h2>
      <p>
        O Form Builder é uma plataforma que permite aos usuários criar
        formulários personalizados, compartilhar links públicos e coletar
        respostas. O serviço inclui:
      </p>
      <ul>
        <li>Criação e edição de formulários</li>
        <li>Geração de links públicos para compartilhamento</li>
        <li>Coleta e visualização de respostas</li>
        <li>Exportação de dados em formato CSV</li>
        <li>Notificações por email</li>
      </ul>

      <h2>3. Conta do Usuário</h2>
      <p>
        Para usar o Form Builder, você precisa criar uma conta usando seu
        endereço de email. Você é responsável por:
      </p>
      <ul>
        <li>Manter a confidencialidade de sua conta</li>
        <li>Todas as atividades que ocorrem em sua conta</li>
        <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
      </ul>

      <h2>4. Uso Aceitável</h2>
      <p>Você concorda em NÃO usar o serviço para:</p>
      <ul>
        <li>Violar leis ou regulamentos aplicáveis</li>
        <li>Coletar dados pessoais sem consentimento adequado</li>
        <li>Enviar spam ou conteúdo malicioso</li>
        <li>Tentar acessar sistemas ou dados não autorizados</li>
        <li>Interferir no funcionamento do serviço</li>
        <li>Criar formulários com conteúdo ilegal, ofensivo ou prejudicial</li>
      </ul>

      <h2>5. Limites de Uso</h2>
      <p>
        Para garantir a qualidade do serviço para todos os usuários,
        estabelecemos os seguintes limites:
      </p>
      <ul>
        <li>Máximo de 10 formulários por conta gratuita</li>
        <li>Máximo de 1.000 respostas por formulário</li>
        <li>Máximo de 50 campos por formulário</li>
      </ul>
      <p>
        Estes limites podem ser alterados a qualquer momento, com aviso prévio.
      </p>

      <h2>6. Propriedade Intelectual</h2>
      <p>
        O serviço Form Builder e todo seu conteúdo, recursos e funcionalidades
        são de propriedade do desenvolvedor. Os dados e formulários que você
        cria permanecem de sua propriedade.
      </p>

      <h2>7. Privacidade</h2>
      <p>
        Sua privacidade é importante para nós. Por favor, revise nossa{" "}
        <a href="/privacidade">Política de Privacidade</a> para entender como
        coletamos, usamos e protegemos suas informações.
      </p>

      <h2>8. Disponibilidade do Serviço</h2>
      <p>
        Nos esforçamos para manter o serviço disponível 24/7, mas não
        garantimos disponibilidade ininterrupta. O serviço pode ser
        temporariamente indisponível para manutenção ou atualizações.
      </p>

      <h2>9. Limitação de Responsabilidade</h2>
      <p>
        O Form Builder é fornecido &quot;como está&quot;, sem garantias de qualquer tipo.
        Não nos responsabilizamos por:
      </p>
      <ul>
        <li>Perda de dados ou interrupção do serviço</li>
        <li>Danos indiretos ou consequentes</li>
        <li>Uso indevido do serviço por terceiros</li>
      </ul>

      <h2>10. Modificações dos Termos</h2>
      <p>
        Reservamos o direito de modificar estes termos a qualquer momento.
        Alterações significativas serão comunicadas por email ou através do
        serviço.
      </p>

      <h2>11. Encerramento</h2>
      <p>
        Podemos suspender ou encerrar sua conta se você violar estes termos.
        Você pode encerrar sua conta a qualquer momento entrando em contato
        conosco.
      </p>

      <h2>12. Contato</h2>
      <p>
        Para dúvidas sobre estes Termos de Uso, entre em contato através do
        email disponível em nosso site.
      </p>
    </>
  );
}

