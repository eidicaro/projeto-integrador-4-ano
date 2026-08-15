<?php

namespace App\Http\Controllers;

use App\Enums\VagaStatus;
use App\Http\Requests\BulkVagaRequest;
use App\Http\Requests\StoreVagaRequest;
use App\Http\Requests\UpdateVagaRequest;
use App\Http\Resources\VagaResource;
use App\Models\Vaga;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class VagaController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'work_mode' => ['nullable', 'string', 'max:30'],
            'employment_type' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', Rule::in(['recent', 'salary_asc', 'salary_desc', 'title'])],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $query = Vaga::query()
            ->where('status', VagaStatus::Published->value)
            ->where(fn (Builder $builder) => $builder
                ->whereNull('data_limite')
                ->orWhereDate('data_limite', '>=', today()))
            ->withCount('candidaturas');

        $this->applyFilters($query, $filters);
        $this->applySort($query, $filters['sort'] ?? 'recent');

        return VagaResource::collection($query->paginate($filters['per_page'] ?? 12));
    }

    public function show(Request $request, Vaga $vaga): VagaResource
    {
        $isOwner = $request->user()?->isRecruiter() === true && $vaga->created_by === $request->user()->id;

        if (! $vaga->isOpenForApplications() && ! $isOwner) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return new VagaResource($vaga->loadCount('candidaturas'));
    }

    public function adminIndex(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(VagaStatus::class)],
            'department' => ['nullable', 'string', 'max:100'],
            'work_mode' => ['nullable', 'string', 'max:30'],
            'employment_type' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', Rule::in(['recent', 'oldest', 'title', 'candidates'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $query = Vaga::query()
            ->where('created_by', $request->user()->id)
            ->withCount('candidaturas');

        $this->applyFilters($query, $filters);
        $this->applyAdminSort($query, $filters['sort'] ?? 'recent');

        return VagaResource::collection($query->paginate($filters['per_page'] ?? 50));
    }

    public function store(StoreVagaRequest $request): JsonResponse
    {
        $this->authorize('create', Vaga::class);
        $data = $request->validated();
        $status = VagaStatus::tryFrom($data['status'] ?? '') ?? VagaStatus::Published;

        $vaga = Vaga::create([
            ...$data,
            'created_by' => $request->user()->id,
            'slug' => $this->uniqueSlug($data['titulo']),
            'status' => $status,
            'publicada_em' => $status === VagaStatus::Published ? now() : null,
        ]);

        return response()->json([
            'message' => 'Vaga criada com sucesso.',
            'data' => new VagaResource($vaga->loadCount('candidaturas')),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateVagaRequest $request, Vaga $vaga): JsonResponse
    {
        $this->authorize('update', $vaga);
        $data = $request->validated();

        if (array_key_exists('status', $data)) {
            $status = VagaStatus::from($data['status']);
            if ($status === VagaStatus::Published && $vaga->publicada_em === null) {
                $data['publicada_em'] = now();
            }
        }

        if (array_key_exists('titulo', $data) && $vaga->slug === null) {
            $data['slug'] = $this->uniqueSlug($data['titulo'], $vaga->id);
        }

        $vaga->update($data);

        return response()->json([
            'message' => 'Vaga atualizada com sucesso.',
            'data' => new VagaResource($vaga->fresh()->loadCount('candidaturas')),
        ]);
    }

    public function updateStatus(Request $request, Vaga $vaga): JsonResponse
    {
        $this->authorize('update', $vaga);
        $data = $request->validate(['status' => ['required', Rule::enum(VagaStatus::class)]]);
        $status = VagaStatus::from($data['status']);

        $vaga->update([
            'status' => $status,
            'publicada_em' => $status === VagaStatus::Published
                ? ($vaga->publicada_em ?? now())
                : $vaga->publicada_em,
        ]);

        return response()->json([
            'message' => 'Status da vaga atualizado.',
            'data' => new VagaResource($vaga->fresh()->loadCount('candidaturas')),
        ]);
    }

    public function duplicate(Request $request, Vaga $vaga): JsonResponse
    {
        $this->authorize('update', $vaga);

        $copy = $vaga->replicate([
            'slug',
            'status',
            'publicada_em',
            'created_at',
            'updated_at',
            'deleted_at',
        ]);
        $copy->titulo = Str::limit($vaga->titulo.' — Cópia', 150, '');
        $copy->slug = $this->uniqueSlug($copy->titulo);
        $copy->status = VagaStatus::Paused;
        $copy->publicada_em = null;
        $copy->save();

        return response()->json([
            'message' => 'Vaga duplicada com sucesso.',
            'data' => new VagaResource($copy->loadCount('candidaturas')),
        ], Response::HTTP_CREATED);
    }

    public function bulk(BulkVagaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $vagas = Vaga::query()
            ->whereIn('id', $data['ids'])
            ->where('created_by', $request->user()->id)
            ->get();

        if ($vagas->count() !== count($data['ids'])) {
            abort(Response::HTTP_FORBIDDEN, 'Uma ou mais vagas não pertencem ao usuário autenticado.');
        }

        DB::transaction(function () use ($vagas, $data): void {
            foreach ($vagas as $vaga) {
                match ($data['action']) {
                    'arquivar' => $vaga->update(['status' => VagaStatus::Archived]),
                    'pausar' => $vaga->update(['status' => VagaStatus::Paused]),
                    'publicar' => $vaga->update([
                        'status' => VagaStatus::Published,
                        'publicada_em' => $vaga->publicada_em ?? now(),
                    ]),
                    'excluir' => $vaga->delete(),
                };
            }
        });

        return response()->json([
            'message' => 'Ação aplicada a '.count($data['ids']).' vaga(s).',
        ]);
    }

    public function destroy(Request $request, Vaga $vaga): Response
    {
        $this->authorize('delete', $vaga);
        $vaga->delete();

        return response()->noContent();
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if ($search = trim((string) ($filters['q'] ?? ''))) {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $query->where(function (Builder $builder) use ($escaped): void {
                $like = "%{$escaped}%";
                $builder->where('titulo', 'like', $like)
                    ->orWhere('empresa', 'like', $like)
                    ->orWhere('departamento', 'like', $like)
                    ->orWhere('localizacao', 'like', $like)
                    ->orWhere('descricao', 'like', $like);
            });
        }

        $map = [
            'status' => 'status',
            'department' => 'departamento',
            'work_mode' => 'modalidade',
            'employment_type' => 'tipo_contratacao',
        ];
        foreach ($map as $filter => $column) {
            if (($filters[$filter] ?? null) !== null) {
                $query->where($column, $filters[$filter]);
            }
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'salary_asc' => $query->orderByRaw('salario_min is null')->orderBy('salario_min'),
            'salary_desc' => $query->orderByDesc('salario_max'),
            'title' => $query->orderBy('titulo'),
            default => $query->latest('publicada_em')->latest('id'),
        };
    }

    private function applyAdminSort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->oldest(),
            'title' => $query->orderBy('titulo'),
            'candidates' => $query->orderByDesc('candidaturas_count'),
            default => $query->latest(),
        };
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'vaga';
        $slug = $base;
        $counter = 2;

        while (Vaga::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
