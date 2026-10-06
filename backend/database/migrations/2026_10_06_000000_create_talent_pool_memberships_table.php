<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('talent_pool_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('interests');
            $table->boolean('active')->default(true);
            $table->dateTime('joined_at');
            $table->dateTime('interests_updated_at');
            $table->dateTime('left_at')->nullable();
            $table->dateTime('consent_accepted_at');
            $table->string('consent_version', 20);
            $table->timestamps();
            $table->index(['active', 'joined_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('talent_pool_memberships');
    }
};
