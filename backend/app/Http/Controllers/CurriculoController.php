<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculoRequest;
use App\Http\Requests\UploadCurriculoFotoRequest;
use App\Http\Resources\CurriculoResource;
use App\Models\Curriculo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CurriculoController extends Controller
{
    private const RELATIONS = ['experiencias', 'formacoes', 'cursos', 'habilidades', 'idiomas'];

    public function index(Request $request)
    {
        $query = Curriculo::query()->with(self::RELATIONS);

        if ($request->user()->isCandidate()) {
            $query->where('user_id', $request->user()->id);
        } else {
            $query->whereHas('candidaturas.vaga', fn ($builder) => $builder->where('created_by', $request->user()->id));
        }

        return CurriculoResource::collection($query->latest()->paginate(20));
    }

    public function me(Request $request): JsonResponse
    {
        $curriculo = $request->user()->curriculo()->with(self::RELATIONS)->first();

        return response()->json([
            'data' => $curriculo ? new CurriculoResource($curriculo) : null,
        ]);
    }

    public function store(StoreCurriculoRequest $request): JsonResponse
    {
        if ($request->user()->curriculo()->exists()) {
            return response()->json([
                'message' => 'Você já possui um currículo. Atualize o currículo existente.',
            ], Response::HTTP_CONFLICT);
        }

        $curriculo = DB::transaction(function () use ($request): Curriculo {
            $data = $request->validated();
            $curriculo = $request->user()->curriculo()->create($this->mainFields($data));
            $this->syncSections($curriculo, $data);

            return $curriculo;
        });

        return response()->json([
            'message' => 'Currículo criado com sucesso.',
            'data' => new CurriculoResource($curriculo->load(self::RELATIONS)),
        ], Response::HTTP_CREATED);
    }

    public function show(Request $request, Curriculo $curriculo): CurriculoResource
    {
        $this->authorize('view', $curriculo);

        return new CurriculoResource($curriculo->load([...self::RELATIONS, 'user']));
    }

    public function update(StoreCurriculoRequest $request, Curriculo $curriculo): JsonResponse
    {
        $this->authorize('update', $curriculo);

        DB::transaction(function () use ($request, $curriculo): void {
            $data = $request->validated();
            $curriculo->update($this->mainFields($data));
            $this->syncSections($curriculo, $data);
        });

        return response()->json([
            'message' => 'Currículo atualizado com sucesso.',
            'data' => new CurriculoResource($curriculo->fresh()->load(self::RELATIONS)),
        ]);
    }

    public function destroy(Request $request, Curriculo $curriculo): Response
    {
        $this->authorize('delete', $curriculo);

        if ($curriculo->candidaturas()->withTrashed()->exists()) {
            return response()->json([
                'message' => 'Este currículo está vinculado a candidaturas e não pode ser excluído.',
            ], Response::HTTP_CONFLICT);
        }

        $this->deletePhoto($curriculo->foto);

        $curriculo->delete();

        return response()->noContent();
    }

    public function uploadFoto(UploadCurriculoFotoRequest $request, Curriculo $curriculo): JsonResponse
    {
        $this->authorize('update', $curriculo);

        $oldPhoto = $curriculo->foto;
        $path = $request->file('foto')->store('curriculos/fotos', 'local');
        $curriculo->update(['foto' => $path]);

        $this->deletePhoto($oldPhoto);

        return response()->json([
            'message' => 'Foto atualizada com sucesso.',
            'data' => new CurriculoResource($curriculo->fresh()->load(self::RELATIONS)),
        ]);
    }

    public function foto(Request $request, Curriculo $curriculo): StreamedResponse
    {
        $this->authorize('view', $curriculo);

        $path = $curriculo->foto;
        if (! $path || Str::startsWith($path, ['http://', 'https://'])) {
            abort(Response::HTTP_NOT_FOUND);
        }

        abort_unless(Storage::disk('local')->exists($path), Response::HTTP_NOT_FOUND);

        return Storage::disk('local')->response($path, null, [
            'Cache-Control' => 'private, no-store',
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function destroyFoto(Request $request, Curriculo $curriculo): Response
    {
        $this->authorize('update', $curriculo);

        if ($curriculo->foto) {
            $this->deletePhoto($curriculo->foto);
            $curriculo->update(['foto' => null]);
        }

        return response()->noContent();
    }

    private function mainFields(array $data): array
    {
        return Arr::only($data, [
            'nome_completo',
            'area_atuacao',
            'telefone',
            'email',
            'cidade_estado',
            'links',
            'resumo',
        ]);
    }

    private function syncSections(Curriculo $curriculo, array $data): void
    {
        foreach (self::RELATIONS as $relation) {
            if (! array_key_exists($relation, $data)) {
                continue;
            }

            $curriculo->{$relation}()->delete();
            if ($data[$relation] !== []) {
                $curriculo->{$relation}()->createMany($data[$relation]);
            }
        }
    }

    private function deletePhoto(?string $path): void
    {
        if (! $path || Str::startsWith($path, ['http://', 'https://'])) {
            return;
        }

        Storage::disk('local')->delete($path);
        Storage::disk('public')->delete($path);
    }
}
