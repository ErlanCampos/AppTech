# Como Rodar os Testes

Como o ambiente atual não possui o Node.js/npm acessível para mim, você precisará rodar os comandos manualmente.

## 1. Corrigir a Instalação do npm
Notei que houve um erro de digitação no seu comando anterior (`intall` em vez de `install`). Tente novamente com:

```bash
sudo apt install npm
```
*(Digite sua senha quando solicitado)*

## 2. Instalar Dependências do Projeto
Após instalar o npm, instale as bibliotecas do projeto (incluindo o Vitest que adicionei):

```bash
npm install
```

## 3. Executar os Testes
Agora você pode rodar (e ver!) os testes passando:

```bash
npm run test
```

## Outros Comandos Úteis
- **Lint (verificar código)**: `npm run lint`
- **Build (compilar)**: `npm run build`
