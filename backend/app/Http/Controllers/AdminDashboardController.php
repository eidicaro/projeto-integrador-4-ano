<?php

namespace App\Http\Controllers;

use App\Enums\CandidaturaStatus;
use App\Enums\VagaStatus;
use App\Http\Resources\CandidaturaResource;
use App\Models\Candidatura;
use App\Models\Vaga;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $jobIds = Vaga::query()
            ->where('created_by', $request->user()->id)
            ->pluck('id');

        $applicationQuery = Candidatura::query()->whereIn('vaga_id', $jobIds);

        $data = [
            'jobs' => [
                'total' => $jobIds->count(),
                'published' => Vaga::where('created_by', $request->user()->id)->where('status', VagaStatus::Published->value)->count(),
                'paused' => Vaga::where('created_by', $request->user()->id)->where('status', VagaStatus::Paused->value)->count(),
                'archived' => Vaga::where('created_by', $request->user()->id)->where('status', VagaStatus::Archived->value)->count(),
            ],
            'applications' => [
                'total' => (clone $applicationQuery)->count(),
                'new' => (clone $applicationQuery)->where('status', CandidaturaStatus::New->value)->count(),
                'interviews' => (clone $applicationQuery)->where('status', CandidaturaStatus::Interview->value)->count(),
                'hired' => (clone $applicationQuery)->where('status', CandidaturaStatus::Hired->value)->count(),
            ],
            'recentApplications' => CandidaturaResource::collection(
                (clone $applicationQuery)->with(['vaga', 'user', 'curriculo.habilidades'])->latest()->limit(8)->get(),
            )->resolve($request),
        ];

        return response()->json(['data' => $data]);
    }
}
