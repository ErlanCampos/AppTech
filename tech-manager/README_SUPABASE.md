# Configuração do Supabase

Siga estes passos para conectar seu aplicativo ao banco de dados real.

## 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com/).
2. Faça login e crie um "New Project".
3. Dê um nome (ex: `tech-manager`) e defina uma senha forte para o banco.
4. Aguarde alguns minutos até o banco ser criado.

## 2. Pegar as Chaves de API
1. No dashboard do seu projeto, vá em **Settings** (ícone de engrenagem) > **API**.
2. Copie a **Project URL** (ex: `https://xyz.supabase.co`).
3. Copie a chave **anon public** (ex: `eyJwhbv...`).

## 3. Configurar Variáveis de Ambiente
1. Crie um arquivo chamado `.env` na raiz do projeto (onde está o `package.json`).
2. Cole o seguinte conteúdo, substituindo pelos seus dados reais:

```env
VITE_SUPABASE_URL=Sua_Project_URL_Aqui
VITE_SUPABASE_ANON_KEY=Sua_Chave_Anon_Aqui
```

## 4. Criar as Tabelas (Schema)
1. No Supabase, vá em **SQL Editor** (ícone de terminal na esquerda).
2. Clique em **New Query**.
3. Copie todo o conteúdo do arquivo `supabase_schema.sql` que criei na raiz do projeto.
4. Cole no editor do Supabase e clique em **RUN**.

Isso criará as tabelas de Usuários/Perfis e Ordens de Serviço, com as permissões de segurança corretas.

## 5. Próximo Passo
Após fazer isso, me avise! Vou atualizar o código do aplicativo para parar de usar os dados fictícios e começar a salvar tudo no seu novo banco de dados.
