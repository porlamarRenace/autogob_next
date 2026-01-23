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
        Schema::create('health_profiles', function (Blueprint $table) {
            $table->id();
            // Relación con el Ciudadano (1 a 1)
            $table->foreignId('citizen_id')->constrained()->cascadeOnDelete();

            // --- Patologías Generales ---
            $table->boolean('has_diabetes')->default(false);
            $table->boolean('has_hypertension')->default(false);
            $table->boolean('has_cancer')->default(false);
            $table->boolean('has_allergies')->default(false);
            $table->boolean('has_alcoholism')->default(false);
            $table->boolean('has_drugs')->default(false);
            $table->boolean('was_operated')->default(false);

            // --- Patologías Específicas (Sistemas) ---
            $table->boolean('has_mental_condition')->default(false);
            $table->boolean('has_eye_condition')->default(false);
            $table->boolean('has_dental_condition')->default(false);
            $table->boolean('has_hereditary_condition')->default(false);
            $table->boolean('has_kidney_condition')->default(false);
            $table->boolean('has_liver_condition')->default(false);
            $table->boolean('has_heart_condition')->default(false);
            $table->boolean('has_gastro_condition')->default(false);
            $table->boolean('has_skin_condition')->default(false);

            // --- Discapacidad ---
            $table->boolean('is_disabled')->default(false);
            $table->string('disability_type')->nullable(); // Ej: Motora, Visual

            // --- Antropometría y Notas ---
            $table->string('blood_type', 10)->nullable(); // Ej: O+, A-
            $table->decimal('weight', 5, 2)->nullable(); // Ej: 75.50
            $table->decimal('height', 5, 2)->nullable(); // Ej: 175.00 (cm) o 1.75 (m)
            
            $table->text('notes')->nullable(); // Antecedentes o notas médicas extra

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_profiles');
    }
};
