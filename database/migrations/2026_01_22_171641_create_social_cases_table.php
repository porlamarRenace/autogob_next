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
        Schema::create('social_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique(); 
            $table->foreignId('citizen_id')->constrained();
            $table->foreignId('user_id')->constrained(); 
            $table->foreignId('assigned_to')->nullable()->constrained('users'); 
    
            $table->foreignId('category_id'); 
            $table->foreignId('subcategory_id')->nullable(); 
    
            $table->string('channel'); 
            $table->text('description');
    
            $table->enum('status', ['open', 'in_progress', 'approved', 'rejected', 'closed'])->default('open');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_cases');
    }
};
