<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;
use App\Models\Municipality;
use App\Models\Community;
use App\Models\Street;
use Illuminate\Support\Facades\Log;

class GeoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear Estado Nueva Esparta
        $state = State::firstOrCreate(['name' => 'Nueva Esparta']);

        // 2. Mapa de normalización (CSV -> Base de Datos)
        // Esto traduce exactamente como viene en el CSV a como lo quieres en tu BD.
        $municipalityMap = [
            'MP. ARISMENDI'          => 'Arismendi',
            'MP.ANTOLIN DEL CAMPO'   => 'Antolín del Campo',
            'MP. DIAZ'               => 'Díaz',
            'MP. GARCIA'             => 'García',
            'MP. GOMEZ'              => 'Gómez',
            'MP. MANEIRO'            => 'Maneiro',
            'MP. MARCANO'            => 'Marcano',
            'MP. MARIÑO'             => 'Mariño',
            'MP.PENIN. DE MACANAO'   => 'Península de Macanao',
            'MP. TUBORES'            => 'Tubores',
            'MP.VILLALBA(I.COCHE)'   => 'Villalba',
        ];

        // Crear los municipios base primero para asegurar que existen
        foreach ($municipalityMap as $csvName => $dbName) {
            Municipality::firstOrCreate([
                'state_id' => $state->id,
                'name'     => $dbName
            ]);
        }

        // 3. Cargar CSV
        // Usamos fopen en lugar de file() para mejor manejo de memoria y comillas
        $csvPath = storage_path('app/calles_nueva_esparta.csv'); // Asegúrate que el nombre coincida

        if (($handle = fopen($csvPath, 'r')) !== false) {
            $header = fgetcsv($handle, 1000, ','); // Leemos la cabecera para saltarla

            $this->command->info('Importando calles y comunidades, esto puede tardar un poco...');
            
            // Caché simple para no consultar la BD en cada fila (Optimización)
            $municipalitiesCache = Municipality::where('state_id', $state->id)->pluck('id', 'name');

            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                // Validación básica de fila vacía
                if (count($row) < 5) continue;

                $csvMuniName   = trim($row[0]);
                $commCode      = trim($row[1]);
                $commName      = trim($row[2]);
                $streetCode    = trim($row[3]);
                $streetName    = trim($row[4]);

                // 1. Normalizar nombre del municipio
                if (!isset($municipalityMap[$csvMuniName])) {
                    // Log::warning("Municipio desconocido en CSV: $csvMuniName");
                    continue;
                }
                
                $realMuniName = $municipalityMap[$csvMuniName];
                $muniId = $municipalitiesCache[$realMuniName] ?? null;

                if ($muniId) {
                    // 2. Buscar o Crear Comunidad
                    // firstOrCreate garantiza que si ya existe para este municipio, devuelve la misma ID.
                    $community = Community::firstOrCreate(
                        [
                            'municipality_id' => $muniId,
                            'name'            => $commName,
                            'code'            => $commCode
                        ]
                    );

                    // 3. Crear Calle
                    // Usamos firstOrCreate para evitar duplicados si corres el seeder dos veces
                    if (!empty($streetName)) {
                        Street::firstOrCreate([
                            'community_id' => $community->id,
                            'name'         => $streetName,
                            'code'         => $streetCode
                        ]);
                    }
                }
            }
            fclose($handle);
            $this->command->info('¡Importación completada con éxito!');
        } else {
            $this->command->error('No se pudo abrir el archivo CSV.');
        }
    }
}