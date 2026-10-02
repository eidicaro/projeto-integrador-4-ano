# Banco de Talentos

Rotas: `/banco-de-talentos` (apresentação pública e participação para candidato autenticado) e `/admin/banco-de-talentos` (recrutador).

## Fronteira de integração

A API atual **não possui adesão, saída, interesses nem listagem de participantes**. Por isso, o módulo opera em demonstração explicitamente identificada nas duas experiências.

- `demoRepository.js`: adapter de adesão local por conta, com `get`, `save` e `leave`. Persiste somente ID, interesses e datas. Não armazena nome, contato, foto ou currículo. Dados permanecem após recarregar, apenas no mesmo navegador/origem; não são sincronizados com outros dispositivos ou Admin.
- `demoTalents.js`: perfis administrativos inteiramente fictícios. Não usa currículos de candidatos reais como se houvesse consentimento de adesão.
- `talentPool.js`: contrato JSDoc, validação, pesquisa, filtros, ordenação, opções e completude. Os mesmos contratos devem ser usados pelo futuro adapter de API.
- `useTalentProfile.js`: reutiliza `GET /curriculos/me` e todas as páginas de `GET /vagas`. Dados de conta vêm do `AuthContext` existente.
- `TalentReferral.jsx`: consulta todas as páginas de `GET /admin/vagas`, usando apenas vagas publicadas do recrutador. A indicação é uma simulação em memória e não cria candidaturas. Não persiste ao recarregar.

O endpoint real `POST /admin/vagas/{vaga}/candidaturas/manual` cria um contato manual, **sem associar o usuário e o currículo**. Portanto, ele não resolve a indicação de um participante real e não deve receber os perfis de demonstração. Nenhum endpoint novo foi inventado, e nenhuma escrita no servidor foi adicionada.

Para habilitar a operação oficial, o servidor precisará fornecer adesão/saída e interesses por candidato, uma coleção paginada autorizada para recrutadores, detalhes autorizados e associação à vaga que preserve usuário/currículo e trate duplicidade. Substituir os adapters locais, remover avisos de demonstração apenas quando a integração estiver implementada, e manter mocks fora do fluxo real.

## Validação

`npm run lint`, `npm test`, `npm run build`. O projeto usa JavaScript; não existe script de TypeScript/typecheck. Os testes de domínio cobrem isolamento por conta, persistência, atualização/saída, armazenamento corrompido/indisponível, validação, sugestões derivadas, busca, filtros e ordenação.

As interfaces usam os estilos existentes, Lucide e Framer Motion já instalados. Diálogos reutilizam `useDialogFocus`, bloqueiam o fundo com `inert`, restauram foco e respeitam movimento reduzido. As páginas são carregadas por `React.lazy`.

A validação em Chromium headless usou respostas controladas das APIs existentes, sem autenticar contas reais nem escrever no servidor. Passaram nove grupos de cenários: Home/navegação, adesão/atualização/saída, falhas de perfil/vagas/armazenamento, busca/filtros/detalhes/indicação, ausência de vagas, layouts entre 320 e 1920 px, acessos pelo Admin existente, proteção por papel e ausência de chamadas fictícias/escritas/erros de runtime. Auditorias axe nas telas pública, candidato, Admin e diálogos avaliados não apontaram violações WCAG A/AA. Relatórios e capturas locais ficam em `frontend/validation-artifacts` (ignorados pelo Git). As ferramentas temporárias de validação não entram nas dependências ou no bundle do produto.
