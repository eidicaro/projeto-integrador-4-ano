<?php

namespace App\Http\Controllers;

use App\Enums\CandidaturaStatus;
use App\Http\Requests\StoreCandidaturaRequest;
use App\Http\Requests\StoreManualCandidaturaRequest;
use App\Http\Requests\UpdateCandidaturaRequest;
use App\Http\Resources\CandidaturaMovimentacaoResource;
use App\Http\Resources\CandidaturaResource;
use App\Models\Candidatura;
use App\Models\Vaga;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidaturaController extends Controller
{
    public function store(StoreCandidaturaRequest $request, ?Vaga $vaga = null): JsonResponse
    {
        $data = $request->validated();
        $vaga ??= Vaga::findOrFail($data['vaga_id']);

        if (! $vaga->isOpenForApplications()) {
            return response()->json([
                'message' => 'Esta vaga não está recebendo candidaturas.',
            ], Response::HTTP_CONFLICT);
        }

        $source = $data['curriculo_origem'] ?? 'online';
        $curriculo = $request->user()->curriculo()->with([
            'habilidades',
            'experiencias',
            'formacoes',
            'cursos',
            'idiomas',
        ])->first();
        if ($source === 'online' && ! $curriculo) {
            return response()->json([
                'message' => 'Crie seu currículo antes de se candidatar.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($source === 'online' && isset($data['curriculo_id']) && (int) $data['curriculo_id'] !== $curriculo->id) {
            return response()->json([
                'message' => 'O currículo informado não pertence ao usuário autenticado.',
            ], Response::HTTP_FORBIDDEN);
        }

        try {
            $resumePath = $source === 'arquivo'
                ? $request->file('curriculo_arquivo')->store('candidaturas/curriculos', 'local')
                : null;

            $candidatura = DB::transaction(function () use ($request, $vaga, $curriculo, $source, $resumePath): Candidatura {
                $candidatura = Candidatura::create([
                    'user_id' => $request->user()->id,
                    'vaga_id' => $vaga->id,
                    'curriculo_id' => $source === 'online' ? $curriculo?->id : null,
                    'curriculo_snapshot' => $source === 'online' ? $this->resumeSnapshot($curriculo) : null,
                    'curriculo_arquivo' => $resumePath,
                    'curriculo_origem' => $source,
                    'nome_candidato' => $curriculo?->nome_completo ?: $request->user()->name,
                    'email_candidato' => $curriculo?->email ?: $request->user()->email,
                    'telefone_candidato' => $curriculo?->telefone ?: $request->user()->telefone,
                    'localizacao_candidato' => $curriculo?->cidade_estado,
                    'experiencia_resumo' => $curriculo?->area_atuacao,
                    'habilidades' => $curriculo?->habilidades->pluck('nome')->values()->all() ?? [],
                    'status' => CandidaturaStatus::New,
                    'origem' => 'plataforma',
                    'status_atualizado_em' => now(),
                ]);
                $this->recordMovement($candidatura, $request->user()->id, null, CandidaturaStatus::New);

                return $candidatura;
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Você já se candidatou para esta vaga.',
            ], Response::HTTP_CONFLICT);
        }

        return response()->json([
            'message' => 'Candidatura enviada com sucesso.',
            'data' => new CandidaturaResource($candidatura->load(['vaga', 'curriculo.habilidades', 'user'])),
        ], Response::HTTP_CREATED);
    }

    public function resumeFile(Request $request, Candidatura $candidatura): StreamedResponse
    {
        $candidatura->load('vaga');
        $this->authorize('view', $candidatura);

        abort_unless(
            $candidatura->curriculo_arquivo
                && Storage::disk('local')->exists($candidatura->curriculo_arquivo),
            Response::HTTP_NOT_FOUND,
        );

        return Storage::disk('local')->download(
            $candidatura->curriculo_arquivo,
            'curriculo-'.$candidatura->id.'.pdf',
            ['Content-Type' => 'application/pdf', 'X-Content-Type-Options' => 'nosniff'],
        );
    }

    public function minhas(Request $request)
    {
        $filters = $request->validate([
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);
        $perPage = (int) ($filters['per_page'] ?? 30);

        return CandidaturaResource::collection(
            Candidatura::query()
                ->where('user_id', $request->user()->id)
                ->with(['vaga', 'curriculo.habilidades'])
                ->latest()
                ->paginate($perPage),
        );
    }

    public function show(Request $request, Candidatura $candidatura): CandidaturaResource
    {
        $candidatura->load('vaga');
        $this->authorize('view', $candidatura);

        return new CandidaturaResource($candidatura->load(['user', 'curriculo.habilidades', 'curriculo.experiencias', 'curriculo.formacoes', 'curriculo.cursos', 'curriculo.idiomas']));
    }

    public function candidatosPorVaga(Request $request, Vaga $vaga)
    {
        $this->authorize('viewCandidates', $vaga);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(CandidaturaStatus::class)],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $query = $vaga->candidaturas()
            ->with(['user', 'curriculo.habilidades', 'curriculo.experiencias', 'curriculo.formacoes', 'curriculo.cursos', 'curriculo.idiomas'])
            ->latest();

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }

        if ($search = trim((string) ($filters['q'] ?? ''))) {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $query->where(function (Builder $builder) use ($escaped): void {
                $like = "%{$escaped}%";
                $builder->where('nome_candidato', 'like', $like)
                    ->orWhere('email_candidato', 'like', $like);
            });
        }

        return CandidaturaResource::collection($query->paginate($filters['per_page'] ?? 100));
    }

    public function adminIndex(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(CandidaturaStatus::class)],
            'per_page' => ['nullable', 'integer', 'between:1,500'],
        ]);

        $query = Candidatura::query()
            ->whereHas('vaga', fn (Builder $builder) => $builder
                ->where('created_by', $request->user()->id)
                ->whereNull('vagas.deleted_at'))
            ->with(['vaga', 'user', 'curriculo.habilidades'])
            ->latest();

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }

        if ($search = trim((string) ($filters['q'] ?? ''))) {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $query->where(function (Builder $builder) use ($escaped): void {
                $like = "%{$escaped}%";
                $builder->where('nome_candidato', 'like', $like)
                    ->orWhere('email_candidato', 'like', $like);
            });
        }

        return CandidaturaResource::collection($query->paginate($filters['per_page'] ?? 200));
    }

    public function storeManual(StoreManualCandidaturaRequest $request, Vaga $vaga): JsonResponse
    {
        $this->authorize('viewCandidates', $vaga);
        $data = $request->validated();

        try {
            $candidatura = DB::transaction(function () use ($data, $request, $vaga): Candidatura {
                $candidatura = Candidatura::create([
                    'vaga_id' => $vaga->id,
                    'nome_candidato' => $data['nome'],
                    'email_candidato' => $data['email'],
                    'telefone_candidato' => $data['telefone'] ?? null,
                    'localizacao_candidato' => $data['localizacao'] ?? null,
                    'experiencia_resumo' => $data['experiencia'] ?? null,
                    'habilidades' => $data['habilidades'] ?? [],
                    'observacoes' => $data['observacoes'] ?? null,
                    'status' => CandidaturaStatus::New,
                    'origem' => 'manual',
                    'atualizada_por' => $request->user()->id,
                    'status_atualizado_em' => now(),
                ]);
                $this->recordMovement($candidatura, $request->user()->id, null, CandidaturaStatus::New);

                return $candidatura;
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'Já existe uma candidatura com este e-mail para a vaga.',
            ], Response::HTTP_CONFLICT);
        }

        return response()->json([
            'message' => 'Candidato adicionado ao processo.',
            'data' => new CandidaturaResource($candidatura),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateCandidaturaRequest $request, Candidatura $candidatura): JsonResponse
    {
        $candidatura->load('vaga');
        $this->authorize('update', $candidatura);
        $data = $request->validated();

        if ($data === []) {
            return response()->json([
                'message' => 'Informe ao menos um campo para atualizar.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($candidatura, $data, $request): void {
            $updates = Arr::only($data, ['status', 'avaliacao', 'observacoes']);
            $updates['atualizada_por'] = $request->user()->id;
            $previousStatus = $candidatura->status;

            if (array_key_exists('status', $updates) && $updates['status'] !== $previousStatus->value) {
                $newStatus = CandidaturaStatus::from($updates['status']);
                $updates['status_atualizado_em'] = now();
                $this->recordMovement(
                    $candidatura,
                    $request->user()->id,
                    $previousStatus,
                    $newStatus,
                    $data['observacoes'] ?? null,
                );
            }

            $candidatura->update($updates);
        });

        return response()->json([
            'message' => 'Candidatura atualizada com sucesso.',
            'data' => new CandidaturaResource($candidatura->fresh()->load(['vaga', 'user', 'curriculo.habilidades'])),
        ]);
    }

    public function withdraw(Request $request, Candidatura $candidatura): JsonResponse
    {
        $candidatura->load('vaga');
        if (! $request->user()->isCandidate() || $candidatura->user_id !== $request->user()->id) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if (in_array($candidatura->status, [
            CandidaturaStatus::Hired,
            CandidaturaStatus::Rejected,
            CandidaturaStatus::Withdrawn,
        ], true)) {
            return response()->json([
                'message' => 'Esta candidatura já está encerrada e não pode ser retirada.',
            ], Response::HTTP_CONFLICT);
        }

        DB::transaction(function () use ($candidatura, $request): void {
            $previousStatus = $candidatura->status;
            $candidatura->update([
                'status' => CandidaturaStatus::Withdrawn,
                'status_atualizado_em' => now(),
            ]);
            $this->recordMovement(
                $candidatura,
                $request->user()->id,
                $previousStatus,
                CandidaturaStatus::Withdrawn,
            );
        });

        return response()->json([
            'message' => 'Candidatura retirada com sucesso.',
            'data' => new CandidaturaResource($candidatura->fresh()->load('vaga')),
        ]);
    }

    public function destroy(Request $request, Candidatura $candidatura): Response
    {
        $candidatura->load('vaga');
        $this->authorize('update', $candidatura);
        $candidatura->delete();

        return response()->noContent();
    }

    public function updateStatus(UpdateCandidaturaRequest $request, Candidatura $candidatura): JsonResponse
    {
        return $this->update($request, $candidatura);
    }

    public function history(Request $request, Candidatura $candidatura)
    {
        $candidatura->load('vaga');
        $this->authorize('view', $candidatura);

        return CandidaturaMovimentacaoResource::collection(
            $candidatura->movimentacoes()->with('user')->paginate(50),
        );
    }

    private function resumeSnapshot($curriculo): array
    {
        return [
            'nome_completo' => $curriculo->nome_completo,
            'area_atuacao' => $curriculo->area_atuacao,
            'telefone' => $curriculo->telefone,
            'email' => $curriculo->email,
            'cidade_estado' => $curriculo->cidade_estado,
            'links' => $curriculo->links ?? [],
            'resumo' => $curriculo->resumo,
            'experiencias' => $curriculo->experiencias->toArray(),
            'formacoes' => $curriculo->formacoes->toArray(),
            'cursos' => $curriculo->cursos->toArray(),
            'habilidades' => $curriculo->habilidades->toArray(),
            'idiomas' => $curriculo->idiomas->toArray(),
        ];
    }

    private function recordMovement(
        Candidatura $candidatura,
        ?int $userId,
        ?CandidaturaStatus $previousStatus,
        CandidaturaStatus $newStatus,
        ?string $observation = null,
    ): void {
        $candidatura->movimentacoes()->create([
            'user_id' => $userId,
            'status_anterior' => $previousStatus,
            'status_novo' => $newStatus,
            'observacao' => $observation,
        ]);
    }
}
