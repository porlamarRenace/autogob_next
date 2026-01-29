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
        Schema::table('citizens', function (Blueprint $table) {
            // Photo for citizen identification
            $table->string('photo')->nullable()->after('longitude');
            
            // Representative for minors (self-referencing)
            $table->foreignId('representative_id')
                ->nullable()
                ->after('photo')
                ->constrained('citizens')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citizens', function (Blueprint $table) {
            $table->dropForeign(['representative_id']);
            $table->dropColumn(['photo', 'representative_id']);
        });
    }
};
