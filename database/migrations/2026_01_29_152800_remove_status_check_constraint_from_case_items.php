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
        // Eliminar el CHECK constraint que limita los valores de status
        DB::statement('ALTER TABLE case_items DROP CONSTRAINT IF EXISTS case_items_status_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurar constraint original si es necesario
        DB::statement("ALTER TABLE case_items ADD CONSTRAINT case_items_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled'))");
    }
};
