# ZR GAMES

Catálogo público com área administrativa protegida por senha.

## Vercel
Configure as variáveis de ambiente:

- `GITHUB_TOKEN`: token de acesso com permissão de leitura e escrita em Contents **somente neste repositório**.
- `ADMIN_PASSWORD`: senha forte e exclusiva do administrador.
- `ADMIN_ALLOWED_PUBLIC_IP` (opcional): **IP público** do administrador. Não use `192.168.100.81`: esse IP é privado e não aparece como origem das requisições feitas pela internet.

A API em `/api/games` valida a senha no servidor antes de cadastrar, editar ou excluir jogos. A página pública não exige login. A página `/admin` redireciona pessoas sem sessão para o catálogo, e o administrador pode acessar `/admin-login.html` para autenticar-se. Atenção: uma senha forte é obrigatória, mesmo com filtro por IP.

Os jogos são gravados em `data/games.json` pelo GitHub API. O token não pode ser colocado no código público.

Adicione jogos apenas quando tiver autorização para distribuir o conteúdo e disponibilize URLs HTTP(S) legítimas.
