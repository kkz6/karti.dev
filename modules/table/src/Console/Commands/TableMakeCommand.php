<?php

declare(strict_types=1);

namespace Modules\Table\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

class TableMakeCommand extends Command
{
    protected $signature = 'make:inertia-table {name} {--module= : The module name} {--model= : The model name} {--force : Overwrite existing files}';
    protected $description = 'Create a new Inertia Table class';

    protected Filesystem $files;

    public function __construct(Filesystem $files)
    {
        parent::__construct();
        $this->files = $files;
    }

    public function handle()
    {
        $name = $this->argument('name');
        $module = $this->option('module');
        $model = $this->option('model');
        $force = $this->option('force');

        if ($module) {
            return $this->createModuleTable($name, $module, $model, $force);
        } else {
            return $this->createAppTable($name, $model, $force);
        }
    }

    protected function createModuleTable(string $name, string $module, ?string $model, bool $force): int
    {
        $module = Str::studly($module);
        $className = Str::studly($name);
        $namespace = "Modules\\{$module}\\Tables";
        $path = base_path("modules/" . Str::lower($module) . "/src/Tables/{$className}.php");

        // Create directory if it doesn't exist
        $this->files->ensureDirectoryExists(dirname($path));

        if ($this->files->exists($path) && !$force) {
            $this->error("Table already exists at {$path}");
            return 1;
        }

        $modelName = $model ?: Str::singular($className);
        if (str_ends_with($modelName, 'Table')) {
            $modelName = substr($modelName, 0, -5);
            $modelName = Str::singular($modelName);
        }

        $modelNamespace = "Modules\\{$module}\\Models\\{$modelName}";

        $stub = $this->getModuleStub();
        $content = str_replace([
            '{{ namespace }}',
            '{{ class }}',
            '{{ namespacedModel }}',
            '{{ model }}'
        ], [
            $namespace,
            $className,
            $modelNamespace,
            $modelName
        ], $stub);

        $this->files->put($path, $content);
        $this->info("Table [{$path}] created successfully.");

        return 0;
    }

    protected function createAppTable(string $name, ?string $model, bool $force): int
    {
        $className = Str::studly($name);
        $namespace = "App\\Tables";
        $path = app_path("Tables/{$className}.php");

        // Create directory if it doesn't exist
        $this->files->ensureDirectoryExists(dirname($path));

        if ($this->files->exists($path) && !$force) {
            $this->error("Table already exists at {$path}");
            return 1;
        }

        $modelName = $model ?: Str::singular($className);
        if (str_ends_with($modelName, 'Table')) {
            $modelName = substr($modelName, 0, -5);
            $modelName = Str::singular($modelName);
        }

        $modelNamespace = "App\\Models\\{$modelName}";

        $stub = $this->getAppStub();
        $content = str_replace([
            '{{ namespace }}',
            '{{ class }}',
            '{{ namespacedModel }}',
            '{{ model }}'
        ], [
            $namespace,
            $className,
            $modelNamespace,
            $modelName
        ], $stub);

        $this->files->put($path, $content);
        $this->info("Table [{$path}] created successfully.");

        return 0;
    }

    protected function getModuleStub(): string
    {
        $stubPath = __DIR__ . '/../../stubs/table.stub';
        if (!$this->files->exists($stubPath)) {
            throw new \Exception("Stub file not found: {$stubPath}");
        }
        return $this->files->get($stubPath);
    }

    protected function getAppStub(): string
    {
        $stubPath = __DIR__ . '/../../stubs/app-table.stub';
        if (!$this->files->exists($stubPath)) {
            throw new \Exception("Stub file not found: {$stubPath}");
        }
        return $this->files->get($stubPath);
    }
}
