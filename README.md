# 🚧 Sistema Locar Grupo
Sistema web em desenvolvimento para a empresa **Locar Grupo**, com foco em integração de operações empresariais, controle de processos e gestão de equipes. Desenvolvido com **Node.js**, **React**, **MongoDB**, e autenticação via **JWT ou cookies de sessão**.

## 🧱 Tecnologias Utilizadas

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow.svg)]() 
- **Frontend:** React.js [![React](https://img.shields.io/badge/frontend-React-blue)]() 
- **Backend:** Node.js (Express) [![Node.js](https://img.shields.io/badge/backend-Node.js-green)]()
- **Banco de Dados:** MongoDB (Mongoose) [![MongoDB](https://img.shields.io/badge/database-MongoDB-brightgreen)]()
- **Autenticação:** JWT ou Cookies de Sessão
- **Gerenciamento de Estado:** Context API / Redux (dependendo da implementação)
- 📄 Licença: Este projeto está licenciado sob os termos da Licença MIT. [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📦 Instalação

### Requisitos
- Node.js (v18+)
- MongoDB (local ou Atlas)
- Git

### 🔧 Configuração das Variáveis de embiente do Git

```
cd \locar
git --version
npm init -y
git config --global user.email "controladoria.locar@outlook.com"
git config --global user.name "Grupo Locar"
```

### ▶️ Passos para rodar o projeto

## 1. Clone este repositório

```
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

## 2. Dependências do backend e frontend

```Backend
cd \locar\backend
npm install
```

```Frontend
cd \locar\frontend
npm install
```

## 3. Criação do projeto

```
cd \locar
npx create-react-app frontend
```

## 4. Instalação das Bibliotecas

### c:\locar>  npm install react-router-dom

Tipo: Biblioteca de roteamento

Descrição: React-router-dom é uma biblioteca para gerenciar navegação e roteamento em aplicações web construídas com React que permite definir diferentes páginas ou "rotas" dentro da aplicação e determinar o que deve ser exibido para o usuário com base na URL.


### c:\locar>  npm install axios

Tipo: Biblioteca para requisições HTTP

Descrição: O axios é uma biblioteca JavaScript baseada em Promise que facilita o envio de requisições HTTP, como GET, POST, PUT, etc., para um servidor usado em React para buscar dados de APIs e para enviar dados para o servidor com uma interface simples e amplamente utilizado por ser fácil de usar em comparação com a API nativa de fetch.


### c:\locar>  npm install bcrypt

Tipo: Biblioteca de criptografia

Descrição: O bcrypt é uma biblioteca usada para hashing e comparação de senhas de maneira segura. Em vez de armazenar senhas em texto claro, você utiliza o bcrypt para criar um "hash" da senha (uma versão em criptografia) e armazena esse hash. Quando o usuário tenta se autenticar, a senha fornecida é transformada novamente em hash e comparada com o hash armazenado no banco de dados.


## 5. Variáveis de ambiente

```
 (arquivos .env em backend/ e frontend/, com as chaves necessárias como DB_URI, JWT_SECRET, etc.)
```

## 6. Inicialização dos servidores

### Backend

```
cd \locar\backend
node server.js
```

### Frontend

```
cd \locar\frontend
npm start -- --host=0.0.0.0
```

## 🧩 Módulos do Sistema

|Módulo| Funcionalidade |
| ---- | -------------- |
| Financeiro | Fluxo de caixa |
| Financeiro | Controle de diárias |
| Financeiro | Contas a Pagar |
| Financeiro | Contas a Receber |
| Financeiro | Emissão de Nota |
| Financeiro | Medição |

|Módulo| Funcionalidade |
| ---- | -------------- |
| Controladoria | Emissão de Faturas |
| Controladoria | Controle de Despesas |
| Controladoria | Controle de Indevidos |
| Controladoria | Emissão de Nota Fiscal |

|Módulo| Funcionalidade |
| ---- | -------------- |
| Recursos Humanos (RH) | Cadastro de Funcionários |
| Recursos Humanos (RH) | Gestão de Candidatos |
| Recursos Humanos (RH) | Gestão de Documentos |
| Recursos Humanos (RH) | Gestão de CNH |
| Recursos Humanos (RH) | Entrevista |

|Módulo| Funcionalidade |
| ---- | -------------- |
| Departamento Pessoal | Monitorar inicialização dos LOC's |
| Departamento Pessoal | Imput de horários no CA |
| Departamento Pessoal | Controle de viagem para alimentação |

|Módulo| Funcionalidade |
| ---- | -------------- |
| Comercial | Cadastro de Clientes/Filial  |
| Comercial | Cadastro de Fornecedores |
| Comercial | Pedidos Sem LOC (PSL) |
| Comercial | Lançamento de Multas e Avarias |
| Comercial | Relatório de Escala |
| Comercial | Relatório de Metas |

|Módulo| Funcionalidade |
| ---- | -------------- |
| Configurações | Parâmetros e Permissões do Sistema  |


### 🔐 Segurança e Acesso
Este repositório é privado e contém informações confidenciais relacionadas à operação da empresa Locar Grupo. O acesso está restrito aos membros autorizados.


### 👥 Contribuidores
Equipe interna de desenvolvimento - Locar Grupo


