<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidaturaController;
use App\Http\Controllers\CurriculoController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VagaController;
use App\Http\Controllers\VagaSalvaController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');

    Route::get('/vagas', [VagaController::class, 'index']);
    Route::get('/vagas/{vaga}', [VagaController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);

        Route::middleware('active')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/me', [ProfileController::class, 'update']);
            Route::get('/me/foto', [ProfileController::class, 'photo']);
            Route::post('/me/foto', [ProfileController::class, 'uploadPhoto']);
            Route::delete('/me/foto', [ProfileController::class, 'destroyPhoto']);

            Route::get('/curriculos/me', [CurriculoController::class, 'me'])->middleware('role:candidato');
            Route::get('/curriculos', [CurriculoController::class, 'index']);
            Route::post('/curriculos', [CurriculoController::class, 'store'])->middleware('role:candidato');
            Route::get('/curriculos/{curriculo}', [CurriculoController::class, 'show']);
            Route::match(['put', 'patch'], '/curriculos/{curriculo}', [CurriculoController::class, 'update'])->middleware('role:candidato');
            Route::delete('/curriculos/{curriculo}', [CurriculoController::class, 'destroy'])->middleware('role:candidato');
            Route::get('/curriculos/{curriculo}/foto', [CurriculoController::class, 'foto']);
            Route::post('/curriculos/{curriculo}/foto', [CurriculoController::class, 'uploadFoto'])->middleware('role:candidato');
            Route::delete('/curriculos/{curriculo}/foto', [CurriculoController::class, 'destroyFoto'])->middleware('role:candidato');
            Route::get('/candidaturas/{candidatura}/curriculo-arquivo', [CandidaturaController::class, 'resumeFile']);

            Route::middleware('role:candidato')->group(function (): void {
                Route::get('/vagas-salvas', [VagaSalvaController::class, 'index']);
                Route::put('/vagas/{vaga}/salvar', [VagaSalvaController::class, 'store']);
                Route::delete('/vagas/{vaga}/salvar', [VagaSalvaController::class, 'destroy']);
                Route::post('/vagas/{vaga}/candidaturas', [CandidaturaController::class, 'store']);
                Route::post('/candidaturas', [CandidaturaController::class, 'store']);
                Route::get('/minhas-candidaturas', [CandidaturaController::class, 'minhas']);
                Route::get('/candidaturas/{candidatura}', [CandidaturaController::class, 'show']);
                Route::get('/candidaturas/{candidatura}/historico', [CandidaturaController::class, 'history']);
                Route::patch('/candidaturas/{candidatura}/retirar', [CandidaturaController::class, 'withdraw']);
            });

            Route::prefix('admin')->middleware('role:recrutador')->group(function (): void {
                Route::get('/dashboard', AdminDashboardController::class);
                Route::get('/vagas', [VagaController::class, 'adminIndex']);
                Route::post('/vagas', [VagaController::class, 'store']);
                Route::post('/vagas/bulk', [VagaController::class, 'bulk']);
                Route::patch('/vagas/{vaga}', [VagaController::class, 'update']);
                Route::put('/vagas/{vaga}', [VagaController::class, 'update']);
                Route::patch('/vagas/{vaga}/status', [VagaController::class, 'updateStatus']);
                Route::post('/vagas/{vaga}/duplicate', [VagaController::class, 'duplicate']);
                Route::delete('/vagas/{vaga}', [VagaController::class, 'destroy']);

                Route::get('/vagas/{vaga}/candidaturas', [CandidaturaController::class, 'candidatosPorVaga']);
                Route::post('/vagas/{vaga}/candidaturas/manual', [CandidaturaController::class, 'storeManual']);
                Route::get('/candidaturas', [CandidaturaController::class, 'adminIndex']);
                Route::get('/candidaturas/{candidatura}', [CandidaturaController::class, 'show']);
                Route::get('/candidaturas/{candidatura}/historico', [CandidaturaController::class, 'history']);
                Route::patch('/candidaturas/{candidatura}', [CandidaturaController::class, 'update']);
                Route::delete('/candidaturas/{candidatura}', [CandidaturaController::class, 'destroy']);
            });

            // Compatibilidade temporária com o contrato do protótipo original.
            Route::middleware('role:recrutador')->group(function (): void {
                Route::get('/vagas/{vaga}/candidatos', [CandidaturaController::class, 'candidatosPorVaga']);
                Route::put('/candidaturas/{candidatura}/status', [CandidaturaController::class, 'updateStatus']);
            });
        });
    });
});
