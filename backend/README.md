# API Point Media Talentos

Backend Laravel do Banco de Talentos. As instruções completas de instalação, segurança e testes ficam no [README principal](../README.md).

Resumo local:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

A especificação funcional dos endpoints está em [docs/API.md](../docs/API.md).

Crie contas administrativas pelo prompt seguro, nunca por cadastro público:

```powershell
php artisan app:create-recruiter
```
