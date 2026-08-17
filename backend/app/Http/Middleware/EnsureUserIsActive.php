<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->ativo !== true) {
            return new JsonResponse([
                'message' => 'Esta conta está desativada. Entre em contato com o suporte.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
