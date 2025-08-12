<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Console\GeneratorCommand;
use Illuminate\Support\Str;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputOption;

#[AsCommand(name: 'make:inertia-table')]
class TableMakeCommand extends GeneratorCommand
{
    /**
     * {@inheritdoc}
     */
    protected $name = 'make:inertia-table';

    /**
     * {@inheritdoc}
     */
    protected $description = 'Create a new Inertia Table class';

    /**
     * {@inheritdoc}
     */
    protected $type = 'Table';

    /**
     * {@inheritdoc}
     */
    protected function getStub()
    {
        return $this->resolveStubPath('/stubs/table.stub');
    }

    /**
     * {@inheritdoc}
     */
    protected function getDefaultNamespace($rootNamespace)
    {
        return $rootNamespace.'\Tables';
    }

    /**
     * Resolve the fully-qualified path to the stub.
     *
     * @return string
     */
    protected function resolveStubPath(string $stub)
    {
        return file_exists($customPath = $this->laravel->basePath(trim($stub, '/')))
            ? $customPath
            : __DIR__.$stub;
    }

    /**
     * {@inheritdoc}
     */
    protected function buildClass($name)
    {
        $stub = $this->files->get($this->getStub());

        $content = $this->replaceNamespace($stub, $name)->replaceClass($stub, $name);

        $namespaceModel = $this->option('model')
            ? $this->qualifyModel($this->option('model'))
            : $this->qualifyModel($this->guessModelName($name));

        $model = class_basename($namespaceModel);

        $replace = [
            'NamespacedDummyModel' => $namespaceModel,
            '{{ namespacedModel }}' => $namespaceModel,
            '{{namespacedModel}}' => $namespaceModel,
            'DummyModel' => $model,
            '{{ model }}' => $model,
            '{{model}}' => $model,
        ];

        return str_replace(
            array_keys($replace), array_values($replace), $content
        );
    }

    /**
     * Guess the model name from the Factory name or return a default model name.
     *
     * @param  string  $name
     */
    protected function guessModelName($name): string
    {
        if (str_ends_with($name, 'Table')) {
            $name = substr($name, 0, -5);
        }

        $name = Str::singular($name);

        $modelName = $this->qualifyModel(Str::after($name, $this->rootNamespace().'Tables'));

        if (class_exists($modelName)) {
            return $modelName;
        }

        if (is_dir(app_path('Models/'))) {
            return $this->rootNamespace().'Models\Model';
        }

        return $this->rootNamespace().'Model';
    }

    /**
     * {@inheritdoc}
     */
    protected function getOptions()
    {
        return [
            ['force', 'f', InputOption::VALUE_NONE, 'Create the class even if the table already exists'],
            ['model', 'm', InputOption::VALUE_OPTIONAL, 'The name of the model'],
        ];
    }
}
