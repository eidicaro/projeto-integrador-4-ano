<?php

namespace App\Http\Controllers;

use App\Enums\CandidaturaStatus;
use App\Http\Requests\SaveTalentPoolMembershipRequest;
use App\Http\Resources\CandidaturaResource;
use App\Http\Resources\TalentPoolMembershipResource;
use App\Http\Resources\TalentResource;
use App\Models\Candidatura;
use App\Models\TalentPoolMembership;
use App\Models\User;
use App\Models\Vaga;
use App\Services\ResumeSnapshot;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class TalentPoolController extends Controller
{
    private const RELATIONS = [
        'user.curriculo.habilidades', 'user.curriculo.experiencias',
        'user.curriculo.formacoes', 'user.curriculo.cursos', 'user.curriculo.idiomas',
    ];

    public function me(Request $request): JsonResponse
    {
        $talent = TalentPoolMembership::available()->where('user_id', $request->user()->id)->first();

        return response()->json(['data' => $talent ? new TalentPoolMembershipResource($talent) : null]);
    }

    public function save(SaveTalentPoolMembershipRequest $request): JsonResponse
    {
        $data = $request->validated();
        $talent = DB::transaction(function () use ($request, $data): TalentPoolMembership {
            // Lock the account too, so two first-time joins cannot insert competing rows.
            $candidate = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            abort_unless($candidate->ativo && $candidate->isCandidate(), 403);
            $talent = TalentPoolMembership::where('user_id', $request->user()->id)->lockForUpdate()->first();
            if (! $talent?->active) {
                if (! $request->boolean('consentAccepted') || ($data['consentVersion'] ?? null) !== TalentPoolMembership::CONSENT_VERSION) {
                    throw ValidationException::withMessages(['consentAccepted' => ['Confirme a adesão e a versão vigente do consentimento.']]);
                }
                $talent ??= new TalentPoolMembership(['user_id' => $request->user()->id]);
                $talent->fill([
                    'active' => true, 'joined_at' => now(), 'left_at' => null,
                    'consent_accepted_at' => now(), 'consent_version' => TalentPoolMembership::CONSENT_VERSION,
                ]);
            }
            if (! $talent->exists || $talent->isDirty('active') || $talent->interests !== $data['interests']) {
                $talent->interests_updated_at = now();
            }
            $talent->interests = $data['interests'];
            $talent->save();

            return $talent;
        });

        return response()->json(['data' => new TalentPoolMembershipResource($talent)]);
    }

    public function leave(Request $request): Response
    {
        DB::transaction(function () use ($request): void {
            $candidate = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            abort_unless($candidate->ativo && $candidate->isCandidate(), 403);
            $talent = TalentPoolMembership::where('user_id', $request->user()->id)->lockForUpdate()->first();
            if ($talent?->active) {
                $talent->update(['active' => false, 'left_at' => now()]);
            }
        });

        return response()->noContent();
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', TalentPoolMembership::class);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'area' => ['nullable', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:255'],
            'period' => ['nullable', Rule::in([7, 30, 90])],
            'sort' => ['nullable', Rule::in(['recent', 'oldest', 'name', 'complete'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);
        // Normalize in PHP for identical accent-insensitive behavior on SQLite and MySQL.
        // This first version loads the authorized pool; replace with an indexed search at scale.
        $all = TalentPoolMembership::available()->with(self::RELATIONS)->get();
        $areas = $all->flatMap(fn ($talent) => $talent->interests)->unique()->sort()->values();
        $locations = $all->map(fn ($talent) => $talent->user->curriculo?->cidade_estado)->filter()->unique()->sort()->values();
        $words = preg_split('/\s+/u', self::normalize($filters['q'] ?? ''), -1, PREG_SPLIT_NO_EMPTY);
        $cutoff = empty($filters['period']) ? null : now()->subDays((int) $filters['period']);
        $filtered = $all->filter(function ($talent) use ($filters, $words, $cutoff): bool {
            $resume = $talent->user->curriculo;
            $search = self::normalize(implode(' ', [
                $resume?->nome_completo ?: $talent->user->name,
                $resume?->area_atuacao, $resume?->cidade_estado,
                ...$talent->interests,
                ...($resume?->habilidades->pluck('nome')->all() ?? []),
                ...($resume?->experiencias->pluck('cargo')->all() ?? []),
            ]));
            foreach ($words as $word) {
                if (! str_contains($search, $word)) {
                    return false;
                }
            }

            return (empty($filters['area']) || in_array($filters['area'], $talent->interests, true))
                && (empty($filters['location']) || $resume?->cidade_estado === $filters['location'])
                && (! $cutoff || $talent->joined_at->gte($cutoff));
        });
        $sort = $filters['sort'] ?? 'recent';
        $filtered = $filtered->sort(function ($a, $b) use ($sort, $request): int {
            $nameA = $a->user->curriculo?->nome_completo ?: $a->user->name;
            $nameB = $b->user->curriculo?->nome_completo ?: $b->user->name;
            $byName = strcmp(self::normalize($nameA), self::normalize($nameB));
            $order = match ($sort) {
                'name' => $byName,
                'complete' => (new TalentResource($b))->toArray($request)['profileCompleteness']
                    <=> (new TalentResource($a))->toArray($request)['profileCompleteness'],
                'oldest' => $a->joined_at <=> $b->joined_at,
                default => $b->joined_at <=> $a->joined_at,
            };

            return $order ?: ($sort === 'complete' ? $byName : 0) ?: ($a->id <=> $b->id);
        })->values();
        $page = (int) ($filters['page'] ?? 1);
        $perPage = (int) ($filters['per_page'] ?? 12);
        $paginator = new LengthAwarePaginator($filtered->forPage($page, $perPage)->values(), $filtered->count(), $perPage, $page, [
            'path' => $request->url(), 'query' => $request->query(),
        ]);

        return TalentResource::collection($paginator)->additional([
            'summary' => [
                'total' => $all->count(),
                'newLast30Days' => $all->filter(fn ($talent) => $talent->joined_at->gte(now()->subDays(30)))->count(),
                'areas' => $areas->count(),
            ],
            'facets' => ['areas' => $areas, 'locations' => $locations],
        ]);
    }

    public function show(TalentPoolMembership $talent): TalentResource
    {
        $talent->load(self::RELATIONS);
        abort_unless($talent->active && $talent->user?->ativo && $talent->user->isCandidate(), 404);
        $this->authorize('view', $talent);

        return new TalentResource($talent);
    }

    public function refer(Request $request, TalentPoolMembership $talent): JsonResponse
    {
        $data = $request->validate(['vaga_id' => ['required', 'integer']]);
        try {
            $application = DB::transaction(function () use ($request, $talent, $data): Candidatura {
                $candidate = User::whereKey($talent->user_id)->lockForUpdate()->firstOrFail();
                $talent = TalentPoolMembership::whereKey($talent->id)->lockForUpdate()->firstOrFail();
                $talent->setRelation('user', $candidate);
                abort_unless($talent->active && $candidate->ativo && $candidate->isCandidate(), 404);
                $this->authorize('view', $talent);
                $job = Vaga::whereKey($data['vaga_id'])->lockForUpdate()->firstOrFail();
                $this->authorize('viewCandidates', $job);
                abort_unless($job->isOpenForApplications(), 409, 'Esta vaga não está recebendo candidaturas.');
                $resume = $candidate->curriculo()->with(['habilidades', 'experiencias', 'formacoes', 'cursos', 'idiomas'])->first();
                if (! $resume) {
                    throw ValidationException::withMessages(['curriculo' => ['O participante precisa criar um currículo antes de ser indicado.']]);
                }
                $email = $resume->email ?: $candidate->email;
                $duplicate = Candidatura::withTrashed()->where('vaga_id', $job->id)
                    ->where(fn ($query) => $query->where('user_id', $candidate->id)->orWhereRaw('LOWER(email_candidato) = ?', [Str::lower($email)]))->exists();
                abort_if($duplicate, 409, 'Já existe uma candidatura deste participante ou e-mail para a vaga.');
                $application = Candidatura::create([
                    'user_id' => $candidate->id, 'vaga_id' => $job->id, 'curriculo_id' => $resume->id,
                    'curriculo_snapshot' => (new ResumeSnapshot)->make($resume),
                    'curriculo_origem' => 'online',
                    'nome_candidato' => $resume->nome_completo ?: $candidate->name,
                    'email_candidato' => $email, 'telefone_candidato' => $resume->telefone ?: $candidate->telefone,
                    'localizacao_candidato' => $resume->cidade_estado, 'experiencia_resumo' => $resume->area_atuacao,
                    'habilidades' => $resume->habilidades->pluck('nome')->values()->all(),
                    'status' => CandidaturaStatus::New, 'origem' => 'banco_de_talentos',
                    'atualizada_por' => $request->user()->id, 'status_atualizado_em' => now(),
                ]);
                $application->movimentacoes()->create([
                    'user_id' => $request->user()->id, 'status_anterior' => null,
                    'status_novo' => CandidaturaStatus::New,
                ]);

                return $application;
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'Já existe uma candidatura deste participante ou e-mail para a vaga.'], 409);
        }

        return response()->json([
            'message' => 'Participante indicado ao processo seletivo.',
            'data' => new CandidaturaResource($application->load(['vaga', 'curriculo.habilidades', 'user'])),
        ], 201);
    }

    private static function normalize(string $value): string
    {
        return Str::lower(Str::ascii(trim($value)));
    }
}
