<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CurriculoController;
use App\Http\Controllers\VagaController;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('curriculos', CurriculoController::class);
    Route::apiResource('vagas', VagaController::class);
});