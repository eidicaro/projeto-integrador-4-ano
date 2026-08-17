<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telefone', 20)->nullable()->after('email');
            $table->boolean('ativo')->default(true)->after('role');
            $table->timestamp('termos_aceitos_em')->nullable()->after('ativo');
            $table->timestamp('ultimo_login_em')->nullable()->after('termos_aceitos_em');
        });

        Schema::table('curriculos', function (Blueprint $table) {
            $table->unique('user_id', 'curriculos_user_id_unique');
        });

        Schema::table('vagas', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->string('slug')->nullable()->unique()->after('titulo');
            $table->string('empresa')->default('Point Media')->after('slug');
            $table->string('departamento')->nullable()->after('empresa');
            $table->string('localizacao')->nullable()->after('departamento');
            $table->string('tipo_contratacao', 40)->nullable()->after('localizacao');
            $table->string('modalidade', 30)->nullable()->after('tipo_contratacao');
            $table->string('senioridade', 30)->nullable()->after('modalidade');
            $table->unsignedSmallInteger('quantidade_vagas')->default(1)->after('senioridade');
            $table->string('email_candidatura')->nullable()->after('quantidade_vagas');
            $table->date('data_limite')->nullable()->after('email_candidatura');
            $table->decimal('salario_min', 12, 2)->nullable()->after('data_limite');
            $table->decimal('salario_max', 12, 2)->nullable()->after('salario_min');
            $table->boolean('salario_visivel')->default(true)->after('salario_max');
            $table->text('responsabilidades')->nullable()->after('descricao');
            $table->json('tags')->nullable()->after('requisitos');
            $table->json('beneficios')->nullable()->after('tags');
            $table->string('imagem')->nullable()->after('beneficios');
            $table->string('status', 20)->default('rascunho')->after('imagem');
            $table->timestamp('publicada_em')->nullable()->after('status');
            $table->softDeletes();
            $table->index(['status', 'publicada_em']);
            $table->index(['modalidade', 'tipo_contratacao']);
        });

        DB::table('candidaturas')->where('status', 'pendente')->update(['status' => 'novo']);

        Schema::table('candidaturas', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('curriculo_id')->nullable()->change();
            $table->json('curriculo_snapshot')->nullable()->after('curriculo_id');
            $table->string('status', 20)->default('novo')->change();
            $table->string('nome_candidato')->nullable()->after('curriculo_id');
            $table->string('email_candidato')->nullable()->after('nome_candidato');
            $table->string('telefone_candidato', 20)->nullable()->after('email_candidato');
            $table->string('localizacao_candidato')->nullable()->after('telefone_candidato');
            $table->string('experiencia_resumo')->nullable()->after('localizacao_candidato');
            $table->json('habilidades')->nullable()->after('experiencia_resumo');
            $table->text('observacoes')->nullable()->after('status');
            $table->unsignedTinyInteger('avaliacao')->nullable()->after('observacoes');
            $table->string('origem', 20)->default('plataforma')->after('avaliacao');
            $table->foreignId('atualizada_por')->nullable()->after('origem')->constrained('users')->nullOnDelete();
            $table->timestamp('status_atualizado_em')->nullable()->after('atualizada_por');
            $table->softDeletes();
            $table->unique(['user_id', 'vaga_id'], 'candidaturas_user_vaga_unique');
            $table->unique(['vaga_id', 'email_candidato'], 'candidaturas_vaga_email_unique');
            $table->index(['vaga_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('candidaturas', function (Blueprint $table) {
            $table->dropUnique('candidaturas_user_vaga_unique');
            $table->dropUnique('candidaturas_vaga_email_unique');
            $table->dropIndex(['vaga_id', 'status']);
            $table->dropForeign(['atualizada_por']);
            $table->dropColumn([
                'nome_candidato',
                'curriculo_snapshot',
                'email_candidato',
                'telefone_candidato',
                'localizacao_candidato',
                'experiencia_resumo',
                'habilidades',
                'observacoes',
                'avaliacao',
                'origem',
                'atualizada_por',
                'status_atualizado_em',
                'deleted_at',
            ]);
        });

        DB::table('candidaturas')
            ->whereNull('user_id')
            ->orWhereNull('curriculo_id')
            ->delete();
        DB::table('candidaturas')
            ->whereIn('status', ['novo', 'triagem', 'entrevista', 'oferta'])
            ->update(['status' => 'pendente']);
        DB::table('candidaturas')
            ->where('status', 'contratado')
            ->update(['status' => 'aprovado']);
        DB::table('candidaturas')
            ->whereIn('status', ['reprovado', 'retirado'])
            ->update(['status' => 'recusado']);

        Schema::table('candidaturas', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreignId('curriculo_id')->nullable(false)->change();
            $table->string('status')->default('pendente')->change();
        });

        Schema::table('vagas', function (Blueprint $table) {
            $table->dropIndex(['status', 'publicada_em']);
            $table->dropIndex(['modalidade', 'tipo_contratacao']);
            $table->dropForeign(['created_by']);
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'created_by',
                'slug',
                'empresa',
                'departamento',
                'localizacao',
                'tipo_contratacao',
                'modalidade',
                'senioridade',
                'quantidade_vagas',
                'email_candidatura',
                'data_limite',
                'salario_min',
                'salario_max',
                'salario_visivel',
                'responsabilidades',
                'tags',
                'beneficios',
                'imagem',
                'status',
                'publicada_em',
                'deleted_at',
            ]);
        });

        Schema::table('curriculos', function (Blueprint $table) {
            $table->dropUnique('curriculos_user_id_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['telefone', 'ativo', 'termos_aceitos_em', 'ultimo_login_em']);
        });
    }
};
