import { Link } from 'react-router-dom';
import LegalLayout, { type SecaoLegal } from '../components/LegalLayout';

const SECOES: SecaoLegal[] = [
  {
    id: 'aceitacao',
    titulo: 'Aceitação dos termos',
    conteudo: (
      <>
        <p>
          Ao criar uma conta ou utilizar a plataforma <strong>AgroGestor</strong>,
          você declara que leu, entendeu e concorda integralmente com estes
          Termos de Uso e com a nossa Política de Privacidade.
        </p>
        <p>
          Caso não concorde com qualquer disposição, recomendamos que não utilize
          os serviços. Estes termos se aplicam a todos os usuários, sejam pessoas
          físicas ou jurídicas.
        </p>
      </>
    ),
  },
  {
    id: 'servico',
    titulo: 'Descrição do serviço',
    conteudo: (
      <>
        <p>
          O AgroGestor é uma plataforma web de gestão de rebanho que permite
          cadastrar animais, acompanhar produção diária, gerar relatórios e
          manter histórico de dados zootécnicos.
        </p>
        <p>
          O serviço é fornecido no modelo <em>Software as a Service (SaaS)</em>,
          com atualizações contínuas e evolução funcional. Podemos adicionar,
          modificar ou descontinuar recursos, sempre comunicando com
          antecedência razoável quando a mudança impactar materialmente sua
          operação.
        </p>
      </>
    ),
  },
  {
    id: 'conta',
    titulo: 'Cadastro e conta de usuário',
    conteudo: (
      <>
        <p>
          Para acessar as funcionalidades da plataforma, você deverá criar uma
          conta informando dados verdadeiros, completos e atualizados.
        </p>
        <ul>
          <li>
            Você é o único responsável por manter a confidencialidade de sua
            senha.
          </li>
          <li>
            É proibido compartilhar credenciais ou permitir acesso por terceiros
            não autorizados.
          </li>
          <li>
            Contas são pessoais e intransferíveis, salvo plano corporativo que
            expressamente permita múltiplos usuários.
          </li>
          <li>
            Em caso de uso indevido ou suspeita de acesso não autorizado,
            notifique-nos imediatamente.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'uso-aceitavel',
    titulo: 'Uso aceitável',
    conteudo: (
      <>
        <p>Ao utilizar o AgroGestor, você concorda em <strong>não</strong>:</p>
        <ul>
          <li>
            Empregar a plataforma para atividades ilícitas, fraudulentas ou que
            violem direitos de terceiros.
          </li>
          <li>
            Tentar acessar áreas restritas, realizar engenharia reversa ou
            explorar vulnerabilidades.
          </li>
          <li>
            Realizar <em>scraping</em> automatizado, sobrecarga intencional ou
            ataques de qualquer natureza.
          </li>
          <li>
            Publicar conteúdo ofensivo, difamatório ou que viole direitos
            autorais.
          </li>
        </ul>
        <div className="legal-callout">
          <span className="legal-callout-icon" aria-hidden="true">!</span>
          <p>
            O descumprimento destas regras pode resultar em suspensão ou
            encerramento da conta, sem prejuízo das medidas legais cabíveis.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'propriedade',
    titulo: 'Propriedade intelectual',
    conteudo: (
      <>
        <p>
          Todo o conteúdo da plataforma — incluindo marca, layout, código-fonte,
          textos, ícones e funcionalidades — é de propriedade exclusiva do
          AgroGestor e protegido pelas leis de propriedade intelectual.
        </p>
        <p>
          Os <strong>dados inseridos por você</strong> (animais, produção,
          relatórios) permanecem de sua propriedade. Você nos concede apenas
          a licença necessária para operar o serviço.
        </p>
      </>
    ),
  },
  {
    id: 'planos',
    titulo: 'Planos e pagamentos',
    conteudo: (
      <>
        <p>
          O AgroGestor oferece plano gratuito com limite de uso e planos pagos
          com funcionalidades adicionais. Valores, ciclos de cobrança e limites
          são descritos na página de preços.
        </p>
        <ul>
          <li>
            Assinaturas são renovadas automaticamente até que você solicite o
            cancelamento.
          </li>
          <li>
            O cancelamento interrompe a cobrança futura, mas não gera reembolso
            proporcional ao período já utilizado, salvo disposição legal em
            contrário.
          </li>
          <li>
            Reajustes de preço serão comunicados com pelo menos 30 dias de
            antecedência.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cancelamento',
    titulo: 'Cancelamento e exclusão',
    conteudo: (
      <>
        <p>
          Você pode cancelar sua conta a qualquer momento, diretamente no painel
          de configurações, sem burocracia ou multa.
        </p>
        <p>
          Ao excluir sua conta, todos os dados de animais e registros vinculados
          serão permanentemente removidos de nossos servidores em até 30 dias,
          ressalvadas obrigações legais de retenção.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilidade',
    titulo: 'Limitação de responsabilidade',
    conteudo: (
      <>
        <p>
          O AgroGestor é fornecido &quot;como está&quot;. Empregamos esforços
          razoáveis para manter a plataforma disponível e segura, mas não
          garantimos operação ininterrupta ou livre de erros.
        </p>
        <p>
          Não nos responsabilizamos por decisões de manejo, perdas indiretas,
          lucros cessantes ou danos decorrentes do uso ou da impossibilidade de
          uso do serviço.
        </p>
        <p>
          Nossa responsabilidade total, em qualquer hipótese, limita-se ao valor
          efetivamente pago por você nos 12 meses anteriores ao evento.
        </p>
      </>
    ),
  },
  {
    id: 'alteracoes',
    titulo: 'Alterações destes termos',
    conteudo: (
      <>
        <p>
          Podemos atualizar estes Termos de Uso periodicamente para refletir
          mudanças legais, técnicas ou operacionais.
        </p>
        <p>
          Alterações materiais serão comunicadas por e-mail ou aviso destacado
          na plataforma com pelo menos 15 dias de antecedência. O uso contínuo
          após a vigência implica aceitação das novas condições.
        </p>
      </>
    ),
  },
  {
    id: 'foro',
    titulo: 'Legislação e foro',
    conteudo: (
      <>
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
        </p>
        <p>
          Eventuais controvérsias serão discutidas preferencialmente por meio de
          negociação amigável. Não havendo composição, fica eleito o foro do
          domicílio do usuário consumidor, conforme o Código de Defesa do
          Consumidor.
        </p>
      </>
    ),
  },
  {
    id: 'contato-termos',
    titulo: 'Contato',
    conteudo: (
      <>
        <p>
          Dúvidas sobre estes Termos podem ser encaminhadas para os canais
          abaixo:
        </p>
        <div className="legal-contato-box">
          <h3>Fale com a gente</h3>
          <p>
            <strong>E-mail:</strong>{' '}
            <a href="mailto:juridico@agrogestor.app">juridico@agrogestor.app</a>
            <br />
            <strong>Suporte:</strong>{' '}
            <a href="mailto:contato@agrogestor.app">contato@agrogestor.app</a>
            <br />
            <strong>Site:</strong>{' '}
            <Link to="/">agrogestor.app</Link>
          </p>
        </div>
      </>
    ),
  },
];

export default function Termos() {
  return (
    <LegalLayout
      tipo="termos"
      titulo="Termos de Uso"
      subtitulo="As regras que regem o uso da plataforma AgroGestor. Escritas de forma clara, sem letras miúdas."
      atualizadoEm="19 de setembro de 2026"
      versao="2.0"
      secoes={SECOES}
      voltarPara={{ rota: '/signup', texto: 'Voltar ao cadastro' }}
    />
  );
}