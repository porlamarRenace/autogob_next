<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use App\Models\Category;
use App\Models\Supply;
use App\Models\Institution;
use App\Models\MedicalService;

class SystemDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->loadAyudas();
        $this->loadInstituciones();
        $this->loadInsumos();
    }

    private function loadAyudas()
    {
        // Cargar archivo ayudas.tipo.categorias.json
        $json = File::get(storage_path('app/json/ayudas.tipo.categorias.json'));
        $data = json_decode($json, true);

        // La estructura del JSON empieza en 'categorias'
        if (isset($data['categorias'])) {
            foreach ($data['categorias'] as $cat) {
                $parent = Category::create([
                    'name' => $cat['nombre'],
                    'description' => $cat['descripcion'] ?? null,
                    'status' => $cat['status'] ?? 'active',
                    'requirements' => isset($cat['requisitos']) ? $cat['requisitos'] : null
                ]);

                if (isset($cat['subcategorias'])) {
                    foreach ($cat['subcategorias'] as $sub) {
                        Category::create([
                            'parent_id' => $parent->id,
                            'name' => $sub['nombre'],
                            'description' => $sub['descripcion'] ?? null,
                            'status' => $sub['status'] ?? 'active',
                            // Hereda requisitos si no tiene propios, o se guardan los propios
                            'requirements' => isset($sub['documentos']) ? ['documentos' => $sub['documentos']] : null
                        ]);
                    }
                }
            }
        }
    }

    private function loadInstituciones()
    {
        // Cargar institucion.servicio.subservicio.json
        // Este JSON no tiene instituciones per se, tiene SERVICIOS. 
        // Vamos a asumir que cargamos los servicios para una "Institución Genérica" o creamos los servicios base.
        // Ojo: Tu JSON empieza con "servicios".
        
        $json = File::get(storage_path('app/json/institucion.servicio.subservicio.json'));
        $data = json_decode($json, true);

        // Creamos una institución base para asignar estos servicios por defecto
        $hospitalCentral = Institution::firstOrCreate(['name' => 'Hospital Central de Margarita']);

        if (isset($data['servicios'])) {
            foreach ($data['servicios'] as $servicio) {
                // El JSON tiene subniveles. Guardamos el servicio principal (ej: Salud)
                // y dentro sus sub-servicios como "MedicalService" o usamos otra lógica.
                
                // Adaptación: Guardaremos los "subservicios" del JSON como MedicalServices en la DB
                if (isset($servicio['subservicios'])) {
                    foreach ($servicio['subservicios'] as $sub) {
                        MedicalService::create([
                            'institution_id' => $hospitalCentral->id,
                            'name' => $sub['nombre'], // Ej: Imagenología
                            'specialties' => isset($sub['especialidades']) ? $sub['especialidades'] : null
                        ]);
                    }
                }
            }
        }
    }

    private function loadInsumos()
    {
        // Cargar insumos_clasificado (3).json
        $json = File::get(storage_path('app/json/insumos_clasificado.json'));
        $data = json_decode($json, true);

        // Buscar la categoría padre "Salud" que creamos en loadAyudas
        $salud = Category::where('name', 'Salud')->first();
        
        if (!$salud) {
            $salud = Category::create(['name' => 'Salud']);
        }
        if (isset($data['categories'])) {
            foreach ($data['categories'] as $catData) {
                $subCat = Category::firstOrCreate([
                    'name' => $catData['name'],
                    'parent_id' => $salud->id
                ]);
                foreach ($catData['items'] as $item) {
                    Supply::create([
                        'category_id' => $subCat->id,
                        'name' => $item['descripcion'] . ($item['forma'] ? ' ' . $item['forma'] : ''),
                        'unit' => $item['unidad'],
                        'concentration' => $item['concentracion'] ?? null,
                        'status' => 'active'
                    ]);
                }
            }
        }
    }
}