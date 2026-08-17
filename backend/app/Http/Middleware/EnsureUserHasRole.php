<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $role = $user?->role;
        $roleValue = $role instanceof UserRole ? $role->value : $role;

        if (! $user || ! in_array($roleValue, $roles, true)) {
            return new JsonResponse([
                'message' => 'Você não tem permissão para realizar esta ação.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
