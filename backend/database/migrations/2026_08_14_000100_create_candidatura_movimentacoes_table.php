<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidatura_movimentacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidatura_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status_anterior', 20)->nullable();
            $table->string('status_novo', 20);
            $table->text('observacao')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['candidatura_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidatura_movimentacoes');
    }
};
