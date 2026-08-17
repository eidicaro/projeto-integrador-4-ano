<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidaturas', function (Blueprint $table): void {
            $table->string('curriculo_arquivo')->nullable()->after('curriculo_snapshot');
            $table->string('curriculo_origem', 20)->default('online')->after('curriculo_arquivo');
        });
    }

    public function down(): void
    {
        Schema::table('candidaturas', function (Blueprint $table): void {
            $table->dropColumn(['curriculo_arquivo', 'curriculo_origem']);
        });
    }
};
