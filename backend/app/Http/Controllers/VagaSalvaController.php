<?php

namespace App\Http\Controllers;

use App\Http\Resources\VagaResource;
use App\Models\Vaga;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VagaSalvaController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $vagas = $request->user()
            ->vagasSalvas()
            ->abertas()
            ->withCount('candidaturas')
            ->orderByDesc('vagas_salvas.created_at')
            ->paginate($data['per_page'] ?? 20);

        return VagaResource::collection($vagas);
    }

    public function store(Request $request, Vaga $vaga): JsonResponse
    {
        if (! $vaga->isOpenForApplications()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $request->user()->vagasSalvas()->syncWithoutDetaching([$vaga->id]);

        return response()->json([
            'message' => 'Vaga salva com sucesso.',
            'data' => new VagaResource($vaga->loadCount('candidaturas')),
        ]);
    }

    public function destroy(Request $request, Vaga $vaga): Response
    {
        $request->user()->vagasSalvas()->detach($vaga->id);

        return response()->noContent();
    }
}
