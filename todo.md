# WhatsApp Manager - TODO

## Banco de Dados
- [x] Criar tabela de números com status, cooldown e informações de uso
- [x] Criar tabela de histórico de uso com logs completos
- [x] Inserir os 13 números iniciais no banco

## Backend (tRPC)
- [x] Implementar query para listar todos os números com status calculado
- [x] Implementar query para obter sugestão inteligente do próximo número
- [x] Implementar mutation para registrar uso de número
- [x] Implementar mutation para bloqueio manual com cooldown estendido
- [x] Implementar query para histórico completo de uso
- [x] Implementar lógica de cálculo de status (Disponível/Em espera/Bloqueado)

## Frontend - Dashboard
- [x] Criar layout principal com tema elegante
- [x] Implementar visualização em tempo real dos 13 números
- [x] Adicionar indicadores visuais de status (cores e ícones)
- [x] Mostrar tempo restante para liberação de cada número
- [x] Implementar botão "Usei este número" com modal de confirmação
- [x] Adicionar painel de sugestão inteligente do próximo número
- [x] Mostrar contador de números disponíveis agora
- [x] Exibir próximas liberações programadas

## Frontend - Histórico
- [x] Criar página de histórico com tabela de logs
- [ ] Filtros por data e número
- [ ] Exportação de relatórios

## Frontend - Bloqueio Manual
- [x] Implementar modal de bloqueio manual
- [x] Opção de cooldown estendido (48h)
- [x] Marcar números como sensíveis
- [x] Sistema de alertas para avisos do WhatsApp

## Testes
- [x] Criar testes vitest para lógica de cooldown
- [x] Testar cálculo de status dos números
- [x] Testar sugestão inteligente
- [x] Testar registro de uso

## Validação Final
- [x] Testar fluxo completo de uso
- [x] Verificar responsividade
- [x] Validar todos os 13 números
- [x] Criar checkpoint final

## Melhorias Solicitadas
- [x] Modificar sugestão inteligente para mostrar 2 números ao invés de 1
- [x] Atualizar frontend para exibir ambos os números sugeridos
- [x] Atualizar testes para validar nova funcionalidade

## Novas Funcionalidades de Gerenciamento
- [x] Adicionar endpoint para desbloquear número
- [x] Adicionar endpoint para excluir número
- [x] Adicionar endpoint para adicionar novo número
- [x] Criar interface com botão "Desbloquear" em números bloqueados
- [x] Criar interface com botão "Excluir" em cada número
- [x] Criar formulário para adicionar novo número
- [x] Atualizar testes

## Melhorias de UI
- [x] Substituir confirm() nativo por AlertDialog moderno do shadcn/ui
- [x] Criar modal de confirmação elegante para desbloquear
- [x] Criar modal de confirmação elegante para excluir

## Gerenciamento de Histórico
- [x] Adicionar endpoint para excluir registro individual do histórico
- [x] Adicionar endpoint para limpar todo o histórico
- [x] Criar botão de excluir em cada linha do histórico
- [x] Criar botão "Limpar Histórico" no topo da página
- [x] Implementar modais de confirmação modernos
- [x] Atualizar testes

## Ordenação de Cards
- [x] Ordenar cards por status: disponíveis primeiro, depois em cooldown, bloqueados por último

## Refatoração de Código
- [x] Criar função getStatus reutilizável para cálculo de status
- [x] Adicionar tie-breaker no sort da sugestão (menos usado + id)
- [x] Adicionar campo de contagem de uso total no banco

## Redesign UI/UX (Padrão SaaS Moderno)
- [x] Transformar Sugestão Inteligente em hero section com destaque máximo
- [x] Redesenhar cards com status visual (ícone + cor + glow sutil)
- [x] Simplificar cards: menos texto, 1 botão principal por estado
- [x] Refinar tipografia: número em destaque, auxiliares com menor opacidade
- [x] Adicionar microinterações (hover, loading, transições suaves)
- [x] Melhorar hierarquia de botões (principal destacado, secundários discretos)

## Empty States
- [x] Adicionar tela de boas-vindas quando não há números cadastrados
- [x] Adicionar mensagem quando nenhum número está disponível
- [x] Mostrar próximo número que ficará disponível e quando

## Validação de Número
- [x] Adicionar validação de formato brasileiro no frontend
- [x] Validar apenas números válidos (+ - ( ) espaços e dígitos)
- [x] Verificar duplicatas no backend
- [x] Adicionar feedback visual de erro em tempo real
- [x] Adicionar validação no backend com Zod

## Bug: Sugestão não atualiza
- [x] Adicionar invalidação automática da query getSuggestion após useNumber
- [x] Adicionar invalidação após blockNumber e unblockNumber
- [x] Testar atualização em tempo real

## Formatação de Telefone
- [x] Adicionar máscara automática no campo de telefone
- [x] Iniciar automaticamente com +55
- [x] Formatar enquanto digita: +55 (XX) XXXXX-XXXX
- [x] Permitir apenas dígitos após o +55

## Bug: Formatação permite números muito longos
- [x] Limitar formatação em 15 dígitos totais (incluindo código do país)
- [x] Bloquear entrada quando atingir o limite
- [x] Adicionar maxLength no Input
