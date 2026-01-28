# 📘 Documentação & Guia de Testes - Marketplace API

Este documento serve como referência para todas as rotas disponíveis na API e fornece um guia passo a passo sobre como testá-las utilizando o **Insomnia**.

---

## 📚 1. Referência das Rotas

A URL base padrão é `http://localhost:3000`.

### 🔐 Autenticação (`/auth`)
*Responsável pelo acesso, registro e tokens.*

| Método | Rota | Auth? | Descrição | Body (Exemplo) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | ❌ | Cria novo usuário. | `{ "name": "João", "email": "joao@teste.com", "password": "123", "type": "customer" }` |
| **POST** | `/auth/login` | ❌ | Login e Tokens. | `{ "email": "joao@teste.com", "password": "123" }` |
| **POST** | `/auth/refresh` | ❌ | Renova Access Token. | `{ "refreshToken": "..." }` |
| **POST** | `/auth/forgot-password` | ❌ | Solicita recuperação. | `{ "email": "joao@teste.com" }` |
| **POST** | `/auth/reset-password` | ❌ | Reseta senha. | `{ "token": "token_email", "newPassword": "nova" }` |
| **PATCH** | `/auth/change-password` | ✅ | Troca senha logado. | `{ "currentPassword": "...", "newPassword": "..." }` |
| **POST** | `/auth/logout` | ✅ | Invalida sessão. | - |

### 👤 Usuários & Perfis (`/users`)
*Gerenciamento de perfil e upgrade de conta.*

| Método | Rota | Auth? | Descrição | Body (Exemplo) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/users/:id` | ✅ | Busca dados públicos. | - |
| **POST** | `/users/become-merchant` | ✅ | Cria Perfil de Loja. | `{ "businessName": "Padaria", "cnpj": "...", "categoryId": "UUID" }` |
| **POST** | `/users/become-professional` | ✅ | Cria Perfil Profissional. | `{ "categories": ["Encanador"], "serviceRadiusKm": 10 }` |
| **POST** | `/users/become-prefecture` | ✅ | Solicita conta Prefeitura. | `{ "officialName": "Pref. Itaberaba", "cnpj": "..." }` |

### 📦 Produtos (`/products`)
*Cadastro de itens para venda (Lojas).*

| Método | Rota | Auth? | Descrição | Nota |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/products` | ✅ | Listagem com filtros. | Query: `?merchantId=UUID` |
| **POST** | `/products` | ✅ | Criar produto. | **Multipart Form** (Campos + Arquivo) |
| **PATCH** | `/products/:id` | ✅ | Atualizar dados. | `{ "price": 50.00 }` |
| **DELETE**| `/products/:id` | ✅ | Remover produto. | Requer ser dono do produto. |

### 🛠️ Serviços (`/services`)
*Cadastro de serviços prestados (Profissionais).*

| Método | Rota | Auth? | Descrição | Nota |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/services` | ❌ | Listar serviços. | Query: `?professionalId=UUID` |
| **POST** | `/services` | ✅ | Criar serviço. | **Multipart Form** |
| **DELETE**| `/services/:id` | ✅ | Remover serviço. | - |

### 🛒 Pedidos (`/orders`)
*Fluxo de compra e baixa de estoque.*

| Método | Rota | Auth? | Descrição | Body (Exemplo) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/orders` | ✅ | Finalizar compra. | *Ver JSON complexo abaixo* |
| **GET** | `/orders/my-orders` | ✅ | Histórico do cliente. | - |
| **GET** | `/orders/merchant-orders` | ✅ | Pedidos da loja. | - |

---

## 🚀 2. Guia de Configuração do Insomnia

Siga este passo a passo para testar a API com produtividade máxima.

### Passo 1: Configurar Ambiente (Environment)
1.  No Insomnia, clique em **Manage Environments** (⚙️).
2.  Crie um sub-ambiente (ex: `Dev Local`).
3.  Adicione este JSON:
    ```json
    {
      "base_url": "http://localhost:3000",
      "token": ""
    }
    ```

### Passo 2: Automação do Token JWT
Para não copiar e colar o token manualmente a cada login:

1.  Crie a requisição de **Login** (`POST /auth/login`).
2.  Volte em **Manage Environments**.
3.  No campo `"token"`, apague o valor atual.
4.  Digite `Response` e selecione a opção **Response => Body Attribute**.
5.  Clique na etiqueta vermelha criada e configure:
    * **Request:** Selecione sua requisição de Login.
    * **Filter:** `$.accessToken`
    * **Trigger Behavior:** Always.
6.  Pronto! A variável `{{ token }}` sempre terá o token válido.

### Passo 3: Usando o Token nas Rotas
Em qualquer rota protegida (ex: Criar Pedido):
1.  Vá na aba **Auth**.
2.  Selecione **Bearer Token**.
3.  No campo Token, digite `{{ token }}`.

---

## 🧪 3. Payloads de Teste (Copiar e Colar)

### A. Criar Pedido (`POST /orders`)
*Substitua os UUIDs pelos IDs reais retornados nas rotas de criação.*

```json
{
  "merchantId": "UUID_DO_COMERCIANTE",
  "paymentMethod": "pix",
  "notes": "Entregar na portaria",
  "deliveryAddressId": "UUID_DO_ENDERECO", 
  "items": [
    {
      "productId": "UUID_DO_PRODUTO_1",
      "quantity": 2
    },
    {
      "productId": "UUID_DO_PRODUTO_2",
      "quantity": 1
    }
  ]
}

B. Virar Profissional (POST /users/become-professional)
JSON
{
  "categories": [
    "Eletricista",
    "Instalação de Ar Condicionado"
  ],
  "serviceRadiusKm": 15,
  "portfolio": [
    "[https://exemplo.com/foto1.jpg](https://exemplo.com/foto1.jpg)"
  ]
}
⚠️ 4. Casos Especiais de Teste
Testando Uploads (Multipart/Form-Data)
O Insomnia não usa JSON para uploads.

Crie uma requisição POST.

Na aba Body, selecione Multipart Form.

Adicione os campos de texto (name, price, etc.).

Para o arquivo:

Crie um campo chamado images (para produtos) ou portfolio.

Mude o tipo do valor de Text para File.

Selecione uma imagem .jpg ou .png do seu PC.

Testando "Esqueci a Senha" (Sem E-mail Real)
Envie POST /auth/forgot-password com seu e-mail.

Vá ao Terminal onde o NestJS está rodando.

Procure o log: 📧 E-MAIL ENVIADO... 🔗 LINK DE RESET: ...token=XYZ...

Copie o token XYZ.

Use na rota POST /auth/reset-password:

JSON
{
  "token": "COLE_O_TOKEN_AQUI",
  "newPassword": "nova_senha_segura"
}
Testando WebSocket (Chat)
No Insomnia, clique em + -> New WebSocket Request.

URL: ws://localhost:3000?token={{ token }}.

Conecte.

Envie JSON para entrar na sala:

JSON
{ "event": "joinConversation", "data": { "room": "chat_ID1_ID2" } }
Envie mensagem:

JSON
{ "event": "sendMessage", "data": { "room": "chat_ID1_ID2", "content": "Olá!" } }
✅ Status do Sistema
Autenticação: ✔️ Completa e Segura (Bcrypt + JWT).

Banco de Dados: ✔️ Transacional e Auditável (Soft Delete + Logs).

Uploads: ✔️ Seguro (Validação MIME Type real).

Negócio: ✔️ Baixa de estoque automática e validação de preços.