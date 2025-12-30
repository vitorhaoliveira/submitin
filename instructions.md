# 📄 Documento de Requisitos de Produto (PRD)
**Produto:** Form Builder Simples  
**Versão:** 0.1  
**Autor:** Vitor Hugo

---

## 🎯 1. Visão Geral do Produto
**Objetivo:**  
Descrever o produto *Form Builder Simples* — um sistema que permite aos usuários criar formulários via interface web e gerar links públicos para compartilhamento e coleta de respostas.

**Problema que resolve:**  
Usuários e equipes sem backend próprio precisam de formulários funcionais com coleta de dados e armazenamento centralizado. :contentReference[oaicite:1]{index=1}

**Público-alvo:**  
- Desenvolvedores
- Profissionais de marketing
- PMEs
- Pessoas sem backend próprio

---

## 👤 2. Personas / Usuários
### 2.1 Administrador
**Responsabilidades:**  
- Criar e gerenciar formulários  
- Ver/baixar respostas  
- Configurar notificações

---

## 🧩 3. User Stories
- **Como usuário**, quero criar um formulário com campos personalizados, **para** coletar dados de respostas.
- **Como usuário**, quero gerar um link público, **para** compartilhar com respondentes.
- **Como usuário**, quero ver respostas no painel, **para** analisar os dados.
- **Como usuário**, quero receber notificações por e-mail, **para** saber quando houver novas respostas.

---

## ⚙️ 4. Requisitos Funcionais
### 4.1 Criação de Formulário
- [ ] O usuário pode adicionar campos: texto, e-mail, número, data, múltipla escolha, checkbox
- [ ] Cada formulário recebe um identificador único

### 4.2 Gerar Link Público
- [ ] O sistema cria uma URL pública para cada formulário
- [ ] Link funciona em navegadores sem autenticação

### 4.3 Receber Respostas
- [ ] Armazenar respostas no banco
- [ ] Mostrar respostas em tabela no painel

### 4.4 Exportar Dados
- [ ] Permitir exportar respostas em CSV

### 4.5 Notificações
- [ ] Notificar por e-mail quando houver nova resposta

### 4.6 Webhooks (Pro)
- [ ] Enviar respostas para URLs configuradas

---

## 🛠 5. Requisitos Não Funcionais
- **R1:** O sistema deve responder em < 500 ms na média.  
- **R2:** Deve suportar segurança básica e anti-spam.  
- **R3:** Deve ser responsivo em mobile/desktop.  
- **R4:** Logs de erro devem ser armazenados por 30 dias.

---

## 📌 6. Telas / UX (Wireframes Descritivos)
### Tela: Criar Formulário
Campos:
- Nome do formulário
- Lista de campos com tipo/ordem
- Botão “Salvar”

### Tela: Visualizar Formulários
- Lista de formulários
- Botões: Editar | Link | Excluir

### Tela: Painel de Respostas
- Tabela com colunas por campo
- Botão “Exportar CSV”

### Tela: Configurações de Notificação
- E-mail
- Webhook

---

## 🧠 7. Endpoints da API (Resumo)
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/forms` | POST | Criar formulário |
| `/api/forms/:id` | GET | Obter formulário |
| `/api/forms/:id` | PUT | Atualizar formulário |
| `/api/forms/:id/responses` | GET | Obter respostas |
| `/api/forms/:id/responses` | POST | Enviar resposta |
| `/api/webhooks` | POST | Configurar webhook |

---

## 📊 8. Métricas e Critérios de Sucesso
- **M1:** Criar formulário em < 2 min sem erro.  
- **M2:** Receber submissões corretamente em pelo menos 99% dos casos.  
- **M3:** Exportar CSV sem perda de dados.

---

## 📅 9. Cronograma / Marcos
- **MVP v0.1:** Formulário básico + link público + painel de respostas — 4 semanas
- **v0.2:** Notificações por e-mail + CSV — 6 semanas
- **v1.0:** Webhooks, autenticação, quota de uso — 8 semanas

---

## 📎 10. Observações / Restrições
- A solução neste MVP não incluirá editor drag-and-drop inicialmente.
- O foco é UX simples e URLs publicáveis.

---

