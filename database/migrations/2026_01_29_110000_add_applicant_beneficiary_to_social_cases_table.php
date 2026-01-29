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
        Schema::table('social_cases', function (Blueprint $table) {
            // Solicitante: persona que solicita la ayuda (puede ser diferente al beneficiario)
            $table->foreignId('applicant_id')
                ->nullable()
                ->after('citizen_id')
                ->constrained('citizens')
                ->nullOnDelete();
            
            // Beneficiario: persona que recibe la ayuda (puede ser = citizen_id para compatibilidad)
            $table->foreignId('beneficiary_id')
                ->nullable()
                ->after('applicant_id')
                ->constrained('citizens')
                ->nullOnDelete();
        });

        // Migrar datos existentes: asignar citizen_id actual como beneficiary_id
        \DB::statement('UPDATE social_cases SET beneficiary_id = citizen_id WHERE beneficiary_id IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_cases', function (Blueprint $table) {
            $table->dropForeign(['applicant_id']);
            $table->dropForeign(['beneficiary_id']);
            $table->dropColumn(['applicant_id', 'beneficiary_id']);
        });
    }
};
