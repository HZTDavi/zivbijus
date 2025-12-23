# Zivbijus E-commerce

Aplicação Fullstack de E-commerce Premium com Painel Administrativo.

## Tecnologias
- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: MySQL

## Pré-requisitos
- **MySQL Server**: É necessário ter um servidor MySQL rodando localmente (ou configurar o `.env`).
- **Banco de Dados**: Crie um banco de dados chamado `zivbijus_db`.

## Inicialização Rápida

1. Configure o arquivo `.env` no diretório `server/`:
   ```ini
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=zivbijus_db
   PORT=3000
   ```

2. Para iniciar ambos os serviços (Backend API e Frontend):
   ```bash
   ./start.sh
   ```

3. (Opcional) Migrar dados do SQLite antigo:
   ```bash
   cd server
   node migrate_db.js
   ```

Acesse a aplicação em: **http://localhost:5173**

## Credenciais de Acesso (Admin)

Para acessar o Painel Administrativo em `/login`:

- **Usuário**: Jessicabat
- **Senha**: Amordaminhavida

## Estrutura do Projeto

- `/client`: Código fonte do Frontend (React)
- `/server`: Código fonte do Backend (API)
