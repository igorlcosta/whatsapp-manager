# WhatsApp Manager

Sistema inteligente de gerenciamento e rodízio de números de WhatsApp com cooldown automático.

![WhatsApp Manager](https://img.shields.io/badge/Status-Ativo-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![tRPC](https://img.shields.io/badge/tRPC-11-2596be)

## 📋 Sobre o Projeto

O WhatsApp Manager é uma solução completa para gerenciar múltiplos números de WhatsApp com sistema inteligente de cooldown automático. Ideal para empresas e profissionais que precisam controlar o uso de vários números para evitar bloqueios e otimizar a comunicação.

### ✨ Principais Funcionalidades

- **Gerenciamento Inteligente**: Controle até 13 números de WhatsApp simultaneamente
- **Cooldown Automático**: Sistema de espera de 24h após cada uso para evitar bloqueios
- **Sugestão Inteligente**: Algoritmo que sugere os 2 melhores números disponíveis baseado em uso e tempo
- **Bloqueio Manual**: Marque números como sensíveis com cooldown estendido de 48h
- **Histórico Completo**: Rastreie todos os usos com timestamps e informações detalhadas
- **Formatação Premium**: Máscara automática para números brasileiros (+55)
- **Interface Moderna**: Design elegante com tema escuro e microinterações
- **Tempo Real**: Atualização automática de status e contadores

## 🚀 Tecnologias

### Frontend
- **React 19** - Framework UI com hooks modernos
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização utilitária
- **shadcn/ui** - Componentes acessíveis
- **tRPC Client** - Type-safe API calls
- **Wouter** - Roteamento leve

### Backend
- **Express 4** - Servidor HTTP
- **tRPC 11** - API type-safe end-to-end
- **Drizzle ORM** - Type-safe database queries
- **MySQL/TiDB** - Banco de dados relacional
- **Vitest** - Framework de testes

### Infraestrutura
- **Manus Platform** - Hospedagem e deploy
- **OAuth** - Autenticação segura
- **S3** - Armazenamento de arquivos

## 📦 Instalação

### Pré-requisitos

- Node.js 22+
- pnpm 8+
- MySQL 8+ ou TiDB

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/igorlcosta/whatsapp-manager.git
cd whatsapp-manager
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL=mysql://user:password@localhost:3306/whatsapp_manager
JWT_SECRET=seu_secret_aqui
VITE_APP_ID=seu_app_id
# ... outras variáveis
```

4. Execute as migrações do banco:
```bash
pnpm db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

6. Acesse: `http://localhost:3000`

## 🗄️ Estrutura do Banco de Dados

### Tabela: `phone_numbers`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | ID único do número |
| phoneNumber | TEXT | Número no formato E.164 (+5511987654321) |
| displayName | TEXT | Nome de exibição opcional |
| lastUsedAt | INTEGER | Timestamp do último uso (ms) |
| isBlocked | INTEGER | 0 = normal, 1 = bloqueado manualmente |
| isSensitive | INTEGER | 0 = normal, 1 = sensível (cooldown 48h) |
| totalUses | INTEGER | Contador total de usos |
| createdAt | INTEGER | Timestamp de criação |

### Tabela: `usage_history`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | ID único do registro |
| phoneNumberId | INTEGER | FK para phone_numbers |
| usedAt | INTEGER | Timestamp do uso |
| action | TEXT | Tipo de ação (use/block/unblock) |
| notes | TEXT | Observações opcionais |

## 🎯 Como Usar

### Dashboard Principal

1. **Visualize Status**: Cards coloridos mostram status de cada número:
   - 🟢 **Verde**: Disponível para uso
   - 🟡 **Amarelo**: Em cooldown (aguardando liberação)
   - 🔴 **Vermelho**: Bloqueado manualmente

2. **Sugestão Inteligente**: 
   - Painel hero mostra os 2 melhores números disponíveis
   - Algoritmo considera: tempo de cooldown + menor uso total
   - Clique em "Usei este número" para registrar uso

3. **Gerenciar Números**:
   - **Adicionar**: Botão no header para cadastrar novos números
   - **Bloquear**: Marque números como sensíveis ou bloqueados
   - **Desbloquear**: Libere números bloqueados manualmente
   - **Excluir**: Remova números do sistema

### Histórico

- Acesse via botão "Histórico" no header
- Visualize todos os usos com timestamps
- Exclua registros individuais ou limpe todo histórico

### Formatação de Telefone

O sistema aceita números brasileiros em qualquer formato:
- `11987654321` → formatado para `+55 (11) 98765-4321`
- `(11) 98765-4321` → normalizado para `+5511987654321`
- Detecta automaticamente celular (9 dígitos) vs fixo (8 dígitos)

## 🧪 Testes

Execute os testes com:

```bash
# Todos os testes
pnpm test

# Testes específicos
pnpm test phone.test.ts
pnpm test auth.logout.test.ts

# Watch mode
pnpm test --watch
```

Cobertura atual: **16 testes** de formatação de telefone + testes de autenticação.

## 📁 Estrutura do Projeto

```
whatsapp-manager/
├── client/                    # Frontend React
│   ├── public/               # Assets estáticos
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       ├── contexts/         # React contexts
│       ├── hooks/            # Custom hooks
│       ├── lib/              # Utilitários (tRPC, phoneUtils)
│       ├── pages/            # Páginas (Home, Historico)
│       ├── App.tsx           # Rotas e layout
│       └── main.tsx          # Entry point
├── server/                   # Backend Express + tRPC
│   ├── _core/               # Infraestrutura (auth, LLM, storage)
│   ├── db.ts                # Query helpers
│   ├── routers.ts           # tRPC procedures
│   └── *.test.ts            # Testes vitest
├── drizzle/                 # Schema e migrações
│   └── schema.ts            # Definição das tabelas
├── shared/                  # Tipos e constantes compartilhados
└── package.json             # Dependências e scripts
```

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Build para produção
pnpm start        # Inicia servidor de produção
pnpm test         # Executa testes
pnpm db:push      # Aplica schema ao banco de dados
pnpm db:studio    # Abre Drizzle Studio (GUI do banco)
```

## 🎨 Customização

### Tema e Cores

Edite `client/src/index.css` para personalizar:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... outras variáveis */
  }
}
```

### Tempo de Cooldown

Edite `shared/constants.ts`:

```typescript
export const COOLDOWN_HOURS = 24;        // Cooldown padrão
export const SENSITIVE_COOLDOWN_HOURS = 48; // Cooldown sensível
```

## 🔒 Segurança

- ✅ Autenticação OAuth via Manus
- ✅ Sessões JWT com httpOnly cookies
- ✅ Validação de entrada com Zod
- ✅ Proteção contra SQL injection (Drizzle ORM)
- ✅ Rate limiting no backend
- ✅ CORS configurado

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] Notificações push quando números ficarem disponíveis
- [ ] Filtros avançados no histórico (data, número, ação)
- [ ] Exportação de dados em CSV/Excel
- [ ] Dashboard com gráficos de uso ao longo do tempo
- [ ] API REST pública para integrações
- [ ] App mobile (React Native)
- [ ] Suporte a múltiplos usuários/equipes

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Igor Costa**
- GitHub: [@igorlcosta](https://github.com/igorlcosta)

## 🙏 Agradecimentos

- [Manus Platform](https://manus.im) - Hospedagem e infraestrutura
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [tRPC](https://trpc.io) - Framework API type-safe
- [Drizzle ORM](https://orm.drizzle.team) - ORM TypeScript

---

Feito com ❤️ para otimizar a gestão de números de WhatsApp
