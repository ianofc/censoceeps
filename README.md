# Censo CEEPS

Aplicação full stack para entrevistas étnico-raciais com estudantes e profissionais da comunidade escolar.

## Executar

```bash
cp .env.example .env
npm install
npm start
```

Acesse `http://localhost:3000`.

Credenciais iniciais (altere em produção): `admin@escola.com` / `123456`.

## Funcionalidades

- Login seguro de entrevistadores com JWT e senha criptografada.
- Entrevista anônima aplicada por um entrevistador a estudante ou funcionário.
- Cadastro de turmas e setores por administradores.
- SQLite com foreign keys, índices e migração inicial automática.
- Dashboard com indicadores, filtros por vínculo e gráficos Chart.js.
- Exportação CSV para análise pedagógica.

Não são armazenados nome, matrícula ou qualquer identificador direto do entrevistado. A aplicação deve ser usada conforme a LGPD, políticas da escola e regras de consentimento aplicáveis.
