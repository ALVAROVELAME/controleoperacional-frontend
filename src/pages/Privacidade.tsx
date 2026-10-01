import { Link } from 'react-router-dom';
import LegalLayout, { type SecaoLegal } from '../components/LegalLayout';

const SECOES: SecaoLegal[] = [
  {
    id: 'introducao',
    titulo: 'Introdução',
    conteudo: (
      <>
        <p>
          Sua privacidade é levada a sério no <strong>AgroGestor</strong>. Esta
          Política explica, de forma clara, quais dados coletamos, por que
          coletamos e como você pode exercer seus direitos.
        </p>
        <p>
          Atuamos em conformidade com a <strong>Lei Geral de Proteção de Dados
          (LGPD — Lei 13.709/2018)</strong> e demais normas aplicáveis.
        </p>
      </>
    ),
  },
  {
    id: 'dados',
    titulo: 'Quais dados coletamos',
    conteudo: (
      <>
        <h3>Dados fornecidos por você</h3>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e senha (armazenada em hash).
          </li>
          <li>
            <strong>Operacionais:</strong> dados de animais, brincos, produção
            diária, categorias e relatórios que você insere na plataforma.
          </li>
          <li>
            <strong>Comunicações:</strong> mensagens enviadas ao suporte.
          </li>
        </ul>

        <h3>Dados coletados automaticamente</h3>
        <ul>
          <li>
            <strong>Uso:</strong> páginas visitadas, ações realizadas e
            preferências (ex.: tema claro/escuro).
          </li>
          <li>
            <strong>Técnicos:</strong> endereço IP, tipo de navegador, sistema
            operacional e identificadores de dispositivo.
          </li>
          <li>
            <strong>Cookies:</strong> estritamente necessários para autenticação
            e funcionamento do serviço.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalidades',
    titulo: 'Como usamos seus dados',
    conteudo: (
      <>
        <p>Utilizamos seus dados exclusivamente para:</p>
        <ul>
          <li>Fornecer e manter a plataforma funcionando corretamente.</li>
          <li>Autenticar seu acesso e proteger sua conta.</li>
          <li>Gerar relatórios e dashboards solicitados por você.</li>
          <li>Enviar comunicações operacionais (confirmação de e-mail, avisos de segurança).</li>
          <li>Melhorar continuamente a experiência do produto.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
        <div className="legal-callout">
          <span className="legal-callout-icon" aria-hidden="true">✓</span>
          <p>
            <strong>Nós não vendemos seus dados.</strong> Seus dados zootécnicos
            nunca são comercializados ou compartilhados com terceiros para fins
            publicitários.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'base-legal',
    titulo: 'Base legal (LGPD)',
    conteudo: (
      <>
        <p>Tratamos dados pessoais com base nas seguintes hipóteses legais:</p>
        <ul>
          <li>
            <strong>Execução de contrato:</strong> para fornecer o serviço
            contratado.
          </li>
          <li>
            <strong>Consentimento:</strong> para comunicações de marketing
            (revogável a qualquer momento).
          </li>
          <li>
            <strong>Legítimo interesse:</strong> para segurança, prevenção de
            fraudes e melhoria do serviço.
          </li>
          <li>
            <strong>Obrigação legal:</strong> quando exigido por lei ou
            autoridade competente.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    titulo: 'Compartilhamento de dados',
    conteudo: (
      <>
        <p>
          Compartilhamos dados apenas com prestadores de serviço essenciais à
          operação, sempre sob contrato de confidencialidade:
        </p>
        <ul>
          <li>
            <strong>Infraestrutura em nuvem:</strong> hospedagem segura dos
            servidores.
          </li>
          <li>
            <strong>Envio de e-mails:</strong> para comunicações transacionais
            (confirmação de conta, recuperação de senha).
          </li>
          <li>
            <strong>Meios de pagamento:</strong> para processar assinaturas
            (quando aplicável).
          </li>
        </ul>
        <p>
          Não compartilhamos dados com terceiros para fins comerciais próprios
          deles.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    titulo: 'Cookies e tecnologias similares',
    conteudo: (
      <>
        <p>Utilizamos dois tipos de cookies:</p>
        <ul>
          <li>
            <strong>Essenciais:</strong> necessários para login e segurança.
            Não podem ser desativados sem quebrar a plataforma.
          </li>
          <li>
            <strong>Preferências:</strong> memorizam suas escolhas (tema,
            idioma).
          </li>
        </ul>
        <p>
          Você pode gerenciar cookies nas configurações do navegador. A
          desativação dos essenciais impedirá o uso da conta.
        </p>
      </>
    ),
  },
  {
    id: 'seguranca',
    titulo: 'Armazenamento e segurança',
    conteudo: (
      <>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados:
        </p>
        <ul>
          <li>Senhas armazenadas com algoritmos de hash robustos.</li>
          <li>Comunicações criptografadas via HTTPS/TLS.</li>
          <li>Backups periódicos e testes de restauração.</li>
          <li>Acesso restrito a colaboradores autorizados.</li>
          <li>Monitoramento contínuo de segurança.</li>
        </ul>
        <p>
          Apesar disso, nenhum sistema é 100% imune. Em caso de incidente que
          afete seus dados, notificaremos você e as autoridades competentes nos
          prazos legais.
        </p>
      </>
    ),
  },
  {
    id: 'direitos',
    titulo: 'Seus direitos (LGPD)',
    conteudo: (
      <>
        <p>Você tem direito a:</p>
        <ul>
          <li>Confirmar a existência de tratamento de seus dados.</li>
          <li>Acessar seus dados a qualquer momento.</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
          <li>Solicitar anonimização, bloqueio ou eliminação.</li>
          <li>Portar seus dados para outro fornecedor (exportação em JSON).</li>
          <li>Revogar consentimento e solicitar exclusão da conta.</li>
          <li>Obter informações sobre compartilhamentos realizados.</li>
        </ul>
        <p>
          Você pode exercer a maioria desses direitos diretamente no painel de
          configurações. Para os demais, entre em contato pelo e-mail abaixo.
        </p>
      </>
    ),
  },
  {
    id: 'retencao',
    titulo: 'Retenção de dados',
    conteudo: (
      <>
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão
          da conta:
        </p>
        <ul>
          <li>Dados pessoais são removidos em até 30 dias.</li>
          <li>
            Alguns registros podem ser mantidos por prazos legais específicos
            (ex.: fiscais, regulatórios).
          </li>
          <li>
            Backups são sobrescritos periodicamente em até 90 dias.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'transferencia',
    titulo: 'Transferência internacional',
    conteudo: (
      <>
        <p>
          Nossos servidores podem estar localizados no Brasil ou em países que
          ofereçam nível adequado de proteção de dados, conforme decisões da
          ANPD.
        </p>
        <p>
          Quando necessário transferir dados internacionalmente, garantimos
          cláusulas contratuais apropriadas para assegurar a mesma proteção
          prevista pela LGPD.
        </p>
      </>
    ),
  },
  {
    id: 'alteracoes-politica',
    titulo: 'Alterações desta política',
    conteudo: (
      <>
        <p>
          Esta Política pode ser atualizada para refletir mudanças legais ou
          operacionais. A data de revisão no topo sempre indicará a versão mais
          recente.
        </p>
        <p>
          Alterações materiais serão comunicadas por e-mail ou aviso na
          plataforma com antecedência razoável.
        </p>
      </>
    ),
  },
  {
    id: 'dpo',
    titulo: 'Encarregado de Dados (DPO)',
    conteudo: (
      <>
        <p>
          Nosso Encarregado de Proteção de Dados está à disposição para receber
          comunicações da ANPD e esclarecer dúvidas de titulares.
        </p>
        <div className="legal-contato-box">
          <h3>Fale com o DPO</h3>
          <p>
            <strong>E-mail:</strong>{' '}
            <a href="mailto:dpo@agrogestor.app">dpo@agrogestor.app</a>
            <br />
            <strong>Assunto sugerido:</strong> &quot;LGPD — [seu pedido]&quot;
            <br />
            <strong>Prazo de resposta:</strong> até 15 dias corridos
            <br />
            <strong>Site:</strong> <Link to="/">agrogestor.app</Link>
          </p>
        </div>
      </>
    ),
  },
];

export default function Privacidade() {
  return (
    <LegalLayout
      tipo="privacidade"
      titulo="Política de Privacidade"
      subtitulo="Transparência total sobre como coletamos, usamos e protegemos seus dados. Em conformidade com a LGPD."
      atualizadoEm="19 de setembro de 2026"
      versao="2.0"
      secoes={SECOES}
      voltarPara={{ rota: '/signup', texto: 'Voltar ao cadastro' }}
    />
  );
}