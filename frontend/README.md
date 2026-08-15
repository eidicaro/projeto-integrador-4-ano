# Frontend Point Media Talentos

Cliente React/Vite integrado à API Laravel. Consulte o [README principal](../README.md) para instalar o projeto completo.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` deve apontar para a origem do Laravel, sem o sufixo `/api` (por exemplo, `http://localhost:8000`).

O cliente usa sessão Sanctum/CSRF com cookies; mantenha frontend e backend usando hosts compatíveis (`localhost` com `localhost`, por exemplo). As páginas são carregadas sob demanda por rota.

Em produção, defina `VITE_API_URL` antes do build e configure fallback SPA para `index.html`. O diretório `public` já fornece `_redirects` para plataformas compatíveis; no Nginx, use `try_files $uri $uri/ /index.html;`.
