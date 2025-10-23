# 🔐 Instruções para Configurar Login Social (Google + Microsoft)

## ✅ Sistema Implementado e Pronto!

O sistema de login social com **Google** e **Microsoft** está completamente implementado no backend e frontend. 
Agora você só precisa adicionar as credenciais OAuth para ativar.

---

## 📋 O QUE FOI IMPLEMENTADO:

### **Backend (`/app/backend/`):**
- ✅ Endpoints OAuth para Google: `/api/auth/google/login` e `/api/auth/google/callback`
- ✅ Endpoints OAuth para Microsoft: `/api/auth/microsoft/login` e `/api/auth/microsoft/callback`
- ✅ Criação/atualização automática de usuários após login social
- ✅ Geração de JWT token após autenticação
- ✅ Armazenamento de dados do perfil (nome, email, foto)
- ✅ Session middleware configurado
- ✅ Bibliotecas instaladas: `authlib`, `httpx`, `itsdangerous`

### **Frontend (`/app/frontend/`):**
- ✅ Botões bonitos de "Continuar com Google" e "Continuar com Microsoft"
- ✅ Logos oficiais dos provedores
- ✅ Captura automática do token após redirect OAuth
- ✅ Integração com AuthContext existente
- ✅ Design 3D moderno

---

## 🔑 PASSO 1: Obter Credenciais do Google OAuth

### **1.1 Acessar Google Cloud Console:**
```
https://console.cloud.google.com/
```

### **1.2 Criar/Selecionar Projeto:**
- Clique em "Select a project" no topo
- Clique em "NEW PROJECT"
- Nome: "ARUANÃ Vision" (ou outro nome)
- Clique em "CREATE"

### **1.3 Habilitar Google+ API:**
- No menu lateral, vá em: **APIs & Services** → **Enabled APIs & services**
- Clique em "+ ENABLE APIS AND SERVICES"
- Busque por "Google+ API"
- Clique em "ENABLE"

### **1.4 Criar Credenciais OAuth:**
- No menu lateral, vá em: **APIs & Services** → **Credentials**
- Clique em "+ CREATE CREDENTIALS" → "OAuth client ID"
- Se aparecer aviso sobre OAuth consent screen:
  - Clique em "CONFIGURE CONSENT SCREEN"
  - Escolha "External" → CREATE
  - Preencha:
    - App name: "ARUANÃ Visão Assistiva"
    - User support email: seu email
    - Developer contact: seu email
  - Clique em "SAVE AND CONTINUE" (pule scopes e test users)

### **1.5 Configurar OAuth Client ID:**
- Application type: **Web application**
- Name: "ARUANÃ Web Client"

**Authorized JavaScript origins:**
```
https://assis-vision.preview.emergentagent.com
```

**Authorized redirect URIs:**
```
https://assis-vision.preview.emergentagent.com/api/auth/google/callback
```

- Clique em "CREATE"
- **COPIE** o Client ID e Client secret que aparecem
- Clique em "OK"

### **1.6 Adicionar ao `.env`:**
Abra `/app/backend/.env` e adicione:
```env
GOOGLE_OAUTH_CLIENT_ID="seu-client-id-aqui"
GOOGLE_OAUTH_CLIENT_SECRET="seu-client-secret-aqui"
```

---

## 🔑 PASSO 2: Obter Credenciais do Microsoft OAuth

### **2.1 Acessar Azure Portal:**
```
https://portal.azure.com
```

### **2.2 Registrar Aplicação:**
- Busque por "Azure Active Directory" (ou "Microsoft Entra ID")
- No menu lateral, clique em **App registrations**
- Clique em "+ New registration"

Preencha:
- **Name:** ARUANÃ Visão Assistiva
- **Supported account types:** 
  - Escolha: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts"
- **Redirect URI:**
  - Platform: **Web**
  - URI: `https://assis-vision.preview.emergentagent.com/api/auth/microsoft/callback`
- Clique em "Register"

### **2.3 Copiar IDs:**
Na página Overview do app registrado, **COPIE**:
- **Application (client) ID**
- **Directory (tenant) ID**

### **2.4 Criar Client Secret:**
- No menu lateral do seu app, clique em **Certificates & secrets**
- Na aba "Client secrets", clique em "+ New client secret"
- Description: "Web App Secret"
- Expires: 24 months (recomendado)
- Clique em "Add"
- **COPIE IMEDIATAMENTE** o Value (client secret) - ele não será mostrado novamente!

### **2.5 Adicionar ao `.env`:**
Abra `/app/backend/.env` e adicione:
```env
MICROSOFT_CLIENT_ID="seu-application-id-aqui"
MICROSOFT_CLIENT_SECRET="seu-client-secret-aqui"
MICROSOFT_TENANT_ID="common"
```

**Nota:** Use `"common"` para permitir contas pessoais e organizacionais da Microsoft.

---

## 🚀 PASSO 3: Ativar o Sistema

### **3.1 Reiniciar o Backend:**
```bash
sudo supervisorctl restart backend
```

### **3.2 Testar:**
1. Acesse: `https://assis-vision.preview.emergentagent.com/login`
2. Você verá os botões de Google e Microsoft
3. Clique em um deles para testar!

---

## 🎯 COMO FUNCIONA:

### **Fluxo de Autenticação:**

1. **Usuário clica** em "Continuar com Google/Microsoft"
2. **Frontend redireciona** para: `/api/auth/{google|microsoft}/login`
3. **Backend inicia** OAuth flow e redireciona para Google/Microsoft
4. **Usuário faz login** na página do provedor
5. **Provedor redireciona** de volta para: `/api/auth/{google|microsoft}/callback`
6. **Backend recebe** dados do usuário, cria/atualiza no MongoDB
7. **Backend gera** JWT token
8. **Backend redireciona** para: `/?token=jwt-token-aqui`
9. **Frontend captura** token da URL e armazena
10. **Usuário está logado!** ✅

---

## 📝 VARIÁVEIS DE AMBIENTE COMPLETAS:

Seu `/app/backend/.env` deve ter:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
GOOGLE_API_KEY="AIzaSyCv8bEpSHtlhJvDjRgzvgNvNxwkMXXukWY"

# OAuth Social Login - Google
GOOGLE_OAUTH_CLIENT_ID="your-google-client-id"
GOOGLE_OAUTH_CLIENT_SECRET="your-google-client-secret"

# OAuth Social Login - Microsoft
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="common"

# Session Secret Key
SESSION_SECRET_KEY="your-secret-key-change-in-production"

# Frontend URL for OAuth redirects
FRONTEND_URL="https://assis-vision.preview.emergentagent.com"
```

---

## ⚠️ IMPORTANTE:

1. **NÃO COMPARTILHE** suas credenciais OAuth (client secrets)
2. **Mantenha** o `.env` no `.gitignore`
3. **Use credenciais diferentes** para produção
4. **Quando fizer deployment:**
   - Atualize as Redirect URIs com o domínio de produção
   - Gere novos secrets para produção
   - Use variáveis de ambiente do servidor

---

## 🔧 TROUBLESHOOTING:

### **"redirect_uri_mismatch":**
- Verifique se a URI no console do provedor é EXATAMENTE igual
- Deve incluir `https://` e o path completo
- Sem "/" no final

### **"invalid_client":**
- Client ID ou Secret incorretos
- Verifique se copiou corretamente sem espaços extras

### **Login funciona mas não redireciona:**
- Verifique `FRONTEND_URL` no `.env`
- Deve ser igual ao domínio atual

### **Backend não inicia:**
```bash
# Ver logs de erro:
tail -n 50 /var/log/supervisor/backend.err.log
```

---

## ✅ CHECKLIST FINAL:

- [ ] Google Client ID e Secret adicionados ao `.env`
- [ ] Microsoft Client ID e Secret adicionados ao `.env`
- [ ] Redirect URIs configuradas nos consoles
- [ ] Backend reiniciado
- [ ] Testado login com Google
- [ ] Testado login com Microsoft
- [ ] Usuário criado automaticamente no MongoDB
- [ ] Token JWT funcionando

---

## 🎉 PRONTO!

Depois de configurar as credenciais, o login social estará 100% funcional!

**Login tradicional (email/senha) continua funcionando normalmente.**
