<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formacoes', function (Blueprint $table): void {
            $table->string('tipo', 40)->default('outro')->after('curriculo_id');
        });
    }

    public function down(): void
    {
        Schema::table('formacoes', function (Blueprint $table): void {
            $table->dropColumn('tipo');
        });
    }
};
