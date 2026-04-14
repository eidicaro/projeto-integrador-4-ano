<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('curriculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
            $table->string('nome_completo');
            $table->string('area_atuacao')->nullable();
            $table->string('telefone')->nullable();
            $table->string('email')->nullable();
            $table->string('cidade_estado')->nullable();
            $table->text('links')->nullable();
            $table->text('resumo')->nullable();
            $table->string('foto')->nullable();
        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculos');
    }
};
