<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Para PostgreSQL, cambiamos la columna enum a string para mayor flexibilidad
        // Primero cambiar el tipo de la columna status a varchar
        DB::statement("ALTER TABLE case_items ALTER COLUMN status TYPE VARCHAR(20)");
        
        // Agregar campos de seguimiento de cumplimiento
        Schema::table('case_items', function (Blueprint $table) {
            $table->timestamp('fulfilled_at')->nullable()->after('review_note');
            $table->foreignId('fulfilled_by')->nullable()->after('fulfilled_at')->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_items', function (Blueprint $table) {
            $table->dropForeign(['fulfilled_by']);
            $table->dropColumn(['fulfilled_at', 'fulfilled_by']);
        });
        
        // Restaurar columna a enum original
        DB::statement("ALTER TABLE case_items ALTER COLUMN status TYPE VARCHAR(20)");
    }
};
