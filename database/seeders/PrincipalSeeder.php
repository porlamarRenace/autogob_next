<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use App\Models\Category;
use App\Models\Supply;

class PrincipalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = storage_path('app/json/insumos_clasificado.json');
        if (!File::exists($path)) {
            $this->command->error("❌ El archivo no existe en: $path");
            return;
        }

        $json = File::get($path);
        if (str_starts_with($json, "\xEF\xBB\xBF")) {
            $json = substr($json, 3);
        }
        $json = trim($json);
        $data = json_decode($json, true);
        
        $salud = Category::firstOrCreate(['name' => 'Salud']);

        foreach ($data['categories'] as $catData) {
            $subCat = Category::create([
                'name' => $catData['name'],
                'parent_id' => $salud->id
            ]);

            foreach ($catData['items'] as $item) {
                Supply::create([
                    'category_id' => $subCat->id,
                    'name' => $item['descripcion'],
                    'unit' => $item['unidad'],
                    'status' => 'active'
                ]);
            }
        }
    }
}
