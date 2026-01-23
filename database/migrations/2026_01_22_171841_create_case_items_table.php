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
        Schema::create('case_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_case_id')->constrained()->onDelete('cascade');
            
            $table->morphs('itemable'); 
            
            $table->integer('quantity');
            $table->string('description')->nullable();
            $table->decimal('approved_quantity', 8, 2)->nullable(); 
            
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users'); 
            $table->text('review_note')->nullable(); 
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_items');
    }
};
