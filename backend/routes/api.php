<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CurriculoController;
use App\Http\Controllers\VagaController;
use App\Http\Controllers\CandidaturaController;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('curriculos', CurriculoController::class);
    Route::apiResource('vagas', VagaController::class);

        // candidatura
        Route::post('/candidaturas', [CandidaturaController::class, 'store']);

        // minhas candidaturas
        Route::get('/minhas-candidaturas', [CandidaturaController::class, 'minhas']);
    
        // admin ver candidatos por vaga
        Route::get('/vagas/{id}/candidatos', [CandidaturaController::class, 'candidatosPorVaga']);
    
        // atualizar status
        Route::put('/candidaturas/{id}/status', [CandidaturaController::class, 'updateStatus']);
});