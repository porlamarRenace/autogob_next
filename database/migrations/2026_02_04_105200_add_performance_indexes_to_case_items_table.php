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
        Schema::table('case_items', function (Blueprint $table) {
            // Add composite index for status and created_at (used in approved aids report)
            $table->index(['status', 'created_at'], 'idx_status_created_at');
            
            // Add index for created_at alone (frequently queried)
            $table->index('created_at', 'idx_created_at');
            
            // Add index for social_case_id (foreign key queries)
            // Note: This might already exist, but we add it explicitly for clarity
            if (!Schema::hasColumn('case_items', 'social_case_id')) {
                $table->index('social_case_id', 'idx_social_case_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_items', function (Blueprint $table) {
            $table->dropIndex('idx_status_created_at');
            $table->dropIndex('idx_created_at');
            
            // Only drop if we created it
            if (Schema::hasIndex('case_items', 'idx_social_case_id')) {
                $table->dropIndex('idx_social_case_id');
            }
        });
    }
};
