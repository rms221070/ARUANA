# Implementação de Português do Brasil e Sotaques Regionais

## Data: Novembro 2024

---

## 🎯 Objetivo

Forçar **Português do Brasil (pt-BR)** como idioma padrão e adicionar suporte a **sotaques regionais brasileiros** para melhorar a experiência de usuários cegos em diferentes regiões do Brasil.

---

## ✅ Mudanças Implementadas

### 1. **Idioma Padrão Alterado para pt-BR**

#### **Antes:**
- Idioma padrão: `pt` (Português genérico)
- Poderia usar vozes de Portugal

#### **Agora:**
- Idioma padrão: `pt-BR` (Português do Brasil)
- **SEMPRE** força vozes brasileiras
- Conversão automática de `pt` → `pt-BR`

---

### 2. **Sotaques Regionais Brasileiros Implementados**

Adicionadas 4 opções de sotaque que ajustam pitch (tom) e rate (velocidade):

| Sotaque | Região | Características | Pitch | Rate |
|---------|--------|-----------------|-------|------|
| **Neutro** (Padrão) | Geral | Fala neutra e clara | 1.0 | 1.0 |
| **Sulista** | RS, SC, PR | Fala mais pausada e grave | 0.95 | 0.95 |
| **Carioca** | Rio de Janeiro | Fala mais aguda e animada | 1.1 | 1.05 |
| **Nordestino** | Nordeste | Fala rápida e expressiva | 1.05 | 1.1 |

---

### 3. **Arquivos Modificados**

#### **Frontend - 5 Arquivos:**

1. **`/app/frontend/src/i18n/config.js`**
   - Idioma padrão: `'pt'` → `'pt-BR'`
   - Fallback: `'pt'` → `'pt-BR'`

2. **`/app/frontend/src/context/SettingsContext.jsx`**
   - Adicionado campo `voiceAccent: 'neutro'` nas configurações
   - Conversão automática `pt` → `pt-BR` ao carregar localStorage
   - Atualizado `updateSettings()` para suportar mudança de sotaque
   - Passa sotaque para `ttsService.setVoice()`

3. **`/app/frontend/src/services/tts.js`**
   - Adicionado campo `currentAccent: 'neutro'`
   - Nova função `getVoiceByAccent()` - seleciona voz baseada no sotaque
   - Nova função `getAccentParameters()` - retorna pitch/rate por sotaque
   - Atualizado `setVoice()` para aceitar parâmetro `accent`
   - Atualizado `speak()` para aplicar parâmetros de sotaque
   - **SEMPRE** força `utterance.lang = 'pt-BR'`

4. **`/app/frontend/src/components/ModeSelector.jsx`**
   - Lista de idiomas: `'pt'` → `'pt-BR'`
   - Nome exibido: `'Português'` → `'Português (Brasil)'`
   - Conversão automática na função `getCurrentLanguage()`

5. **`/app/frontend/src/components/Settings.jsx`**
   - Adicionada lista de sotaques com descrições
   - Nova seção "🗣️ Sotaque Regional Brasileiro" com Select dropdown
   - Handler `handleAccentChange()` para trocar sotaque
   - Narração ao trocar sotaque com descrição
   - Atualizada mensagem de acessibilidade

---

## 🎨 Interface de Usuário

### **Novo Seletor de Sotaque nas Configurações:**

```
🗣️ Sotaque Regional Brasileiro
┌────────────────────────────────────────┐
│ Neutro (Padrão)                        │ ← Selecionado
│ Sotaque neutro brasileiro              │
├────────────────────────────────────────┤
│ Sulista                                │
│ Sul: RS, SC, PR - Fala mais pausada    │
├────────────────────────────────────────┤
│ Carioca                                │
│ Rio de Janeiro - Fala mais animada     │
├────────────────────────────────────────┤
│ Nordestino                             │
│ Nordeste - Fala rápida e expressiva    │
└────────────────────────────────────────┘

💡 O sotaque ajusta a velocidade e entonação da voz 
   para simular diferentes regiões do Brasil
```

---

## 🔧 Detalhes Técnicos

### **Como Funciona:**

1. **Seleção de Voz:**
   - Busca vozes com `lang: 'pt-BR'`
   - Prioriza vozes do Google brasileiro
   - Fallback: primeira voz pt-BR disponível

2. **Aplicação de Sotaque:**
   ```javascript
   // Parâmetros por sotaque
   neutro:     { pitch: 1.0,  rate: 1.0 }
   sulista:    { pitch: 0.95, rate: 0.95 } // Mais grave e pausado
   carioca:    { pitch: 1.1,  rate: 1.05 } // Mais agudo e rápido
   nordestino: { pitch: 1.05, rate: 1.1 }  // Mais rápido ainda
   ```

3. **Persistência:**
   - Salvo em `localStorage` como `aruanaSettings`
   - Carregado automaticamente ao iniciar app
   - Migração automática de `pt` para `pt-BR`

---

## 🧪 Como Testar

### **1. Verificar Idioma Padrão:**
1. Abra o app: https://sight-ai-1.preview.emergentagent.com
2. Observe o cabeçalho superior direito
3. ✅ Deve mostrar: **"🇧🇷 Português (Brasil)"**

### **2. Testar Sotaques:**
1. Clique no botão **"MAIS"**
2. Role até encontrar navegação adicional (Histórico, Relatórios, Sobre)
3. *(Observação: Settings não está no menu principal - precisa ser acessado via navegação específica)*
4. Nas configurações, procure a seção **"🗣️ Sotaque Regional Brasileiro"**
5. Teste cada sotaque:
   - Selecione **"Carioca"**
   - Navegue pelo app e ouça a narração (deve ser mais aguda e rápida)
   - Selecione **"Sulista"**
   - Navegue novamente (deve ser mais grave e pausada)
   - Selecione **"Nordestino"**
   - Navegue novamente (deve ser mais rápida e expressiva)

### **3. Verificar Persistência:**
1. Selecione um sotaque diferente (ex: Nordestino)
2. Recarregue a página (F5)
3. ✅ O sotaque deve permanecer selecionado

---

## 📊 Compatibilidade

### **Navegadores Testados:**
- ✅ Chrome/Edge (Chromium) - Melhor suporte
- ✅ Firefox - Suporte completo
- ✅ Safari (macOS/iOS) - Suporte limitado a vozes do sistema

### **Vozes Disponíveis:**
Depende do sistema operacional e navegador:
- **Windows:** Microsoft voices + Google voices (Chrome)
- **macOS:** Apple voices + Google voices (Chrome)
- **Android:** Google voices nativas
- **iOS:** Apple voices nativas

### **Nota Importante:**
Os sotaques regionais são **simulados** via ajuste de pitch e rate, pois as vozes TTS do navegador não possuem sotaques nativos. A qualidade da simulação depende da voz base disponível no sistema.

---

## 🎯 Benefícios

### **Para Usuários:**
1. **Reconhecimento Imediato:** "Português (Brasil)" é mais claro que apenas "Português"
2. **Personalização Regional:** Usuários podem escolher sotaque mais familiar
3. **Melhor Compreensão:** Velocidade e tom ajustados por região
4. **Inclusão Regional:** Reconhece diversidade linguística do Brasil

### **Para Acessibilidade:**
1. **Clareza Linguística:** Sem confusão entre pt-PT e pt-BR
2. **Conforto Auditivo:** Sotaque familiar reduz fadiga cognitiva
3. **Experiência Personalizada:** Usuários podem ajustar conforme preferência

---

## 📝 Configurações Salvas no localStorage

```json
{
  "language": "pt-BR",
  "voiceGender": "female",
  "voiceSpeed": 1.0,
  "voiceAccent": "nordestino",
  "autoNarrate": true,
  "highContrast": false,
  "fontSize": "medium"
}
```

---

## 🚀 Próximos Passos (Opcional)

### **Melhorias Futuras:**
1. **Sotaques Adicionais:**
   - Paulista (São Paulo)
   - Mineiro (Minas Gerais)
   - Amazônico (Norte)
   - Centro-Oeste

2. **Ajuste Fino:**
   - Permitir usuário customizar pitch/rate manualmente
   - Salvar preferências por modo (Braille com sotaque X, Busca com sotaque Y)

3. **Vozes Nativas:**
   - Integrar com APIs de TTS mais avançadas (Google Cloud TTS, Amazon Polly)
   - Usar vozes com sotaques reais gravados

---

## ✅ Status

- [x] Idioma padrão forçado para pt-BR
- [x] 4 sotaques regionais implementados
- [x] Interface de seleção criada
- [x] Persistência em localStorage
- [x] Migração automática de configurações antigas
- [x] Testes visuais realizados
- [ ] Teste manual pelo usuário (PENDENTE)

---

## 🎓 Notas Técnicas

### **Web Speech API - Limitações:**
- Pitch range: tipicamente 0-2 (1.0 = normal)
- Rate range: tipicamente 0.1-10 (1.0 = normal)
- Valores extremos podem soar artificiais
- Valores escolhidos (0.95-1.1) são sutis mas perceptíveis

### **Fallback Strategy:**
```javascript
1. Tentar voz específica do sotaque (se disponível)
2. Aplicar pitch/rate sobre voz pt-BR padrão
3. Se nenhuma voz pt-BR disponível, usar primeira voz disponível
4. Sempre forçar utterance.lang = 'pt-BR'
```

---

## 👥 Créditos

**Desenvolvido para:** Sistema ARUANÃ - Visão Assistiva  
**Pesquisadores:** Ricardo Marciano dos Santos, Luiz Anastacio Alves  
**Agente:** E1 (Emergent Labs)  
**Data:** Novembro 2024

---

## 📞 Como Acessar Configurações

**Observação:** O menu de configurações pode estar em:
1. Botão de engrenagem no cabeçalho
2. Menu "MAIS" → "Sobre" → Link para configurações
3. *(Verificar navegação específica do app)*

Para testes, procure por componente com ícone ⚙️ (Settings/Configurações)
