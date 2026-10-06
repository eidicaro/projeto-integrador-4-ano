# Diagnóstico do sistema — 06/10/2026

## Resultado e escopo

O backend do Banco de Talentos foi implementado conforme o guia da raiz. Participação e interesses ficam em uma nova tabela, sem duplicar dados da conta ou currículo. Os seis endpoints estão em [API.md](API.md). Foram preservados os fluxos anteriores de candidatura voluntária, inclusão manual e permissões dos processos existentes.

As telas do Banco de Talentos foram conectadas à API real: adesão, atualização, saída, consulta administrativa, detalhe e indicação. Os avisos demonstrativos foram removidos após ensaio com Laravel real. O aceite é explícito e as indicações são identificadas como feitas pela equipe. Preferências locais anteriores não são importadas.

## Inconsistências encontradas e correções

| Achado | Evidência e ação |
|---|---|
| Etapas de auditoria do CI falham com os locks anteriores | Composer reportou quatro advisories em Laravel, CommonMark e Flysystem. npm reportou quatro vulnerabilidades em cada aplicação, incluindo a dependência shell-quote do backend. Locks atualizados; auditorias agora sem vulnerabilidades reportadas. |
| Testes de domínio frontend ausentes do CI | Workflow tinha lint e build, mas não npm test. Etapa acrescentada. |
| PROJECT_STATUS.md negava a existência de mocks e trazia números antigos como estado atual | O Banco de Talentos usa demoRepository e demoTalents. O relatório anterior foi identificado como histórico e recebeu atualização com as verificações desta entrega. |
| README da funcionalidade e guia diziam que o servidor não tinha API | Adicionados estado atualizado e referência aos contratos efetivamente implementados. O guia original permanece como especificação histórica. |
| Permissão antiga de currículo não atendia participantes sem candidatura | CurriculoPolicy permite leitura/foto de participantes disponíveis; saída revoga esse acesso, mantendo acessos por processos anteriores. Coberto por testes. |
| Endpoint manual não representa indicação de conta real | Novo endpoint preserva user_id, curriculo_id, snapshot e histórico; inclusão manual mantém comportamento anterior. |
| Nome da migration de agosto sugeria participação já implementada | Ela apenas ampliava entidades existentes. Criada migration própria de participação, com unicidade e reversão testada. |

## Implementação entregue

- Adesão e reentrada com consentimento v1 validado no servidor; interesses livres, trim e rejeição de duplicatas por caixa/acentos.
- Adesão sem currículo; atualização preserva entrada e aceite. Repetição sem alteração preserva a data dos interesses.
- Saída idempotente; não remove conta, currículo ou candidaturas. Reentrada reinicia o ciclo no mesmo registro.
- Policy explícita para empresa única, contas/papéis ativos e propriedade da vaga na indicação.
- Consulta paginada com busca de todos os termos, filtros, quatro ordenações e desempate estável.
- Indicadores e facets calculados no conjunto autorizado completo, antes dos filtros e paginação.
- Contato com fallback para conta, completude de oito verificações e currículo atual com seções.
- Indicação com validação de vaga aberta, currículo existente, duplicatas e soft delete. Origem banco_de_talentos e autor registrado.
- Transações com bloqueio de conta, participação e vaga; revalidação da participação na indicação e tratamento da exceção de unicidade com 409.
- Serviço ResumeSnapshot compartilhado com candidaturas voluntárias.

## Verificações executadas nesta entrega

| Verificação | Resultado |
|---|---|
| PHPUnit, SQLite em memória, PHP 8.2.12 | 83 testes / 598 asserções; aprovado |
| Novos testes do Banco de Talentos | 12 testes; consentimento, ciclos/datas, validação, papéis, isolamento, busca/filtros/paginação/indicadores, detalhe, foto, indicação, duplicatas, saída, snapshot, reversão da migration e tratamento da exceção concorrente |
| Laravel Pint no backend completo | Aprovado |
| Composer validate --strict | Aprovado |
| Composer audit --locked | Zero advisories reportados |
| Frontend ESLint | Aprovado |
| Frontend npm test | 11 testes; aprovado |
| Frontend build | Aprovado |
| npm audit --audit-level=high, frontend e backend | Zero vulnerabilidades reportadas |
| git diff --check | Aprovado |

Atualizações PHP: Laravel 12.69.3, CommonMark 2.10.3, Flysystem 3.36.0. Atualizações npm compatíveis incluem Axios 1.20.0 e source-map-js 1.2.2. O backend usa override específico de shell-quote 1.12.0 em concurrently 9.2.4 para corrigir a dependência transitiva sem downgrade de concurrently.

As auditorias refletem os advisories conhecidos no momento desta execução, não uma garantia permanente. Nenhum teste existente de backend falhou na execução final.

## Limites e pendências reais

1. Integração frontend concluída e validada em navegador com backend real e SQLite isolado. Os 11 testes Node incluem quatro testes do adapter oficial; os sete testes históricos mantêm fixtures somente como dados de teste.
2. MySQL 8.4 não foi executado localmente; o job permanece no CI. O teste da exceção concorrente simula a violação de unicidade; não executa dois clientes simultâneos. Bloqueios reais e concorrência com saída devem ser validados no MySQL.
3. A consulta administrativa carrega a coleção autorizada e os currículos em memória. Filtros e indicadores são corretos para o conjunto, mas esse custo precisa de revisão para grandes volumes.
4. Escopo de empresa única. Não há vínculo organizacional para isolar talentos entre empresas.
5. Histórico de ciclos de adesão não é armazenado separadamente. O registro conserva o ciclo atual e o último aceite, conforme a primeira versão do guia.
6. Foi realizado ensaio em Chrome headless com conferência das telas em 375 px, sem erros de runtime. Não foi refeita auditoria axe.
7. Após configurar o ambiente local, a primeira execução MySQL falhou com erro 1067 em interests_updated_at. As quatro datas do ciclo foram alteradas de TIMESTAMP para DATETIME para evitar defaults implícitos incompatíveis com o modo estrito. A execução seguinte de php artisan migrate --seed --no-interaction concluiu a migration e o seeder no banco local, sem recriar ou apagar tabelas. A suíte completa MySQL 8.4 e concorrência real continuam pendentes.

## Ativação e reprodução

Instalar os locks atualizados e aplicar a migration no ambiente configurado:

~~~powershell
cd backend
composer install
php artisan migrate
php vendor/bin/phpunit --display-warnings --display-deprecations
php vendor/bin/pint --test
composer audit --locked
npm.cmd ci
npm.cmd audit --audit-level=high
~~~

Frontend:

~~~powershell
cd frontend
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd audit --audit-level=high
~~~

No Windows desta sessão, npm.ps1 foi bloqueado pela política de execução; npm.cmd funcionou sem alterar a política do sistema.

Se o CI ainda falhar após estas mudanças, o nome do job, a etapa e o primeiro erro completo permitirão verificar a falha restante, especialmente no MySQL. As falhas de auditoria foram reproduzidas localmente; não foi consultado o log da execução remota.

### Correção de compatibilidade MySQL/MariaDB

A migration usa DATETIME em joined_at, interests_updated_at, left_at e consent_accepted_at. Os campos obrigatórios seguem sem default e são preenchidos pela aplicação. Isso evita o default zero implícito de múltiplas colunas TIMESTAMP obrigatórias em servidores com configuração legada de timestamps. O tipo dateTime permanece compatível com os casts existentes e as respostas ISO 8601.


## Validação da integração frontend

Ensaio com Chrome headless, Vite e Laravel real, em banco SQLite separado do MySQL do usuário:

- Adesão explícita, persistência após reload, alteração de interesses, saída e reentrada com consentimento novamente desmarcado.
- Lista de 14 participantes em páginas de 12 e 2; busca por nome, localização e habilidade com múltiplos termos sem acentos.
- Indicadores do conjunto completo preservados durante a busca, detalhe autorizado e indicação que cria candidatura real.
- Duplicidade retorna 409 e aparece como erro, sem novo sucesso.
- Indicação aparece na rota frontend /candidaturas como indicação da equipe; endpoint backend correspondente é /api/minhas-candidaturas.
- Saída remove a participante da consulta administrativa, preservando a indicação já criada.
- Falha de leitura da participação impede adesão; nova tentativa restaura o formulário.
- Nenhum erro de runtime no navegador; lint, 11 testes Node e build aprovados.

O ensaio usou contas, vagas e dados temporários em pasta ignorada pelo Git; os serviços de validação foram encerrados ao final.
