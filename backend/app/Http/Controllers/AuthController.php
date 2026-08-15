<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'telefone' => $data['telefone'],
            'password' => $data['password'],
            'role' => UserRole::Candidate,
            'ativo' => true,
            'termos_aceitos_em' => now(),
        ]);

        return response()->json([
            'message' => 'Conta criada com sucesso.',
            'data' => ['user' => new UserResource($user)],
        ], Response::HTTP_CREATED);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'As credenciais informadas são inválidas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! $user->ativo) {
            return response()->json([
                'message' => 'Esta conta está desativada. Entre em contato com o suporte.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($user, (bool) ($data['remember'] ?? false));
            $request->session()->regenerate();
        }

        $token = null;
        if ($data['issue_token'] ?? false) {
            $abilities = $user->isRecruiter() ? ['recruiter'] : ['candidate'];
            $expiration = config('sanctum.expiration');
            $expiresAt = is_numeric($expiration) ? now()->addMinutes((int) $expiration) : null;
            $token = $user->createToken($data['device_name'], $abilities, $expiresAt)->plainTextToken;
        }

        $user->forceFill(['ultimo_login_em' => now()])->save();

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ['user' => new UserResource($request->user())],
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }

    public function logoutAll(Request $request): Response
    {
        $request->user()->tokens()->delete();

        return $this->logout($request);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email:rfc', 'max:254']]);

        Password::sendResetLink(['email' => mb_strtolower(trim($request->string('email')->toString()))]);

        return response()->json([
            'message' => 'Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email:rfc', 'max:254'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'O link de redefinição é inválido ou expirou.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }
}
