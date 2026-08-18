<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UploadProfilePhotoRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'data' => ['user' => new UserResource($user->fresh())],
        ]);
    }

    public function photo(Request $request): StreamedResponse
    {
        $path = $request->user()->foto;

        abort_unless($path && Storage::disk('local')->exists($path), Response::HTTP_NOT_FOUND);

        return Storage::disk('local')->response($path, null, [
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function uploadPhoto(UploadProfilePhotoRequest $request): JsonResponse
    {
        $user = $request->user();
        $oldPhoto = $user->foto;
        $path = $request->file('foto')->store('usuarios/fotos', 'local');
        $user->update(['foto' => $path]);

        if ($oldPhoto && $oldPhoto !== $path) {
            Storage::disk('local')->delete($oldPhoto);
        }

        return response()->json([
            'message' => 'Foto de perfil atualizada com sucesso.',
            'data' => ['user' => new UserResource($user->fresh())],
        ]);
    }

    public function destroyPhoto(Request $request): Response
    {
        $user = $request->user();

        if ($user->foto) {
            Storage::disk('local')->delete($user->foto);
            $user->update(['foto' => null]);
        }

        return response()->noContent();
    }
}
