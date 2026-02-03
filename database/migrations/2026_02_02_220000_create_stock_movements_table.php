<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supply_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['entry', 'exit']);
            $table->integer('quantity');
            $table->string('reason'); // compra, donacion, entrega, ajuste, merma
            $table->nullableMorphs('reference'); // Relacionar con caso/item si aplica
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Agregar campo de stock actual a supplies
        Schema::table('supplies', function (Blueprint $table) {
            $table->integer('current_stock')->default(0)->after('status');
            $table->integer('min_stock')->default(5)->after('current_stock'); // Alerta de stock bajo
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropColumn(['current_stock', 'min_stock']);
        });
    }
};
